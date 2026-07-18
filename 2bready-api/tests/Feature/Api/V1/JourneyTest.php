<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Industry\Models\Industry;
use App\Domain\Journey\Actions\CompleteMilestoneAction;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Models\MilestoneCompletion;
use App\Domain\Package\Enums\Tier;
use App\Domain\Package\Models\Package;
use App\Domain\Payment\Models\Subscription;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->industry = Industry::factory()->create(['code' => 'F&B']);
    $this->template = JourneyTemplate::factory()->create(['country_code' => 'KH', 'industry_id' => $this->industry->id]);

    $this->l1 = JourneyLevel::factory()->create(['journey_template_id' => $this->template->id, 'code' => 'L1', 'pillar' => 'comply', 'sort_order' => 1]);
    $this->l2 = JourneyLevel::factory()->create(['journey_template_id' => $this->template->id, 'code' => 'L2', 'pillar' => 'scale', 'sort_order' => 2]);
    $this->l3 = JourneyLevel::factory()->create(['journey_template_id' => $this->template->id, 'code' => 'L3', 'pillar' => 'scale', 'sort_order' => 3]);

    $this->l1MilestoneA = Milestone::factory()->create(['journey_level_id' => $this->l1->id, 'sort_order' => 1]);
    $this->l2MilestoneA = Milestone::factory()->create(['journey_level_id' => $this->l2->id, 'sort_order' => 1]);
    $this->l2MilestoneB = Milestone::factory()->create(['journey_level_id' => $this->l2->id, 'sort_order' => 2]);
    $this->l3MilestoneA = Milestone::factory()->create(['journey_level_id' => $this->l3->id, 'sort_order' => 1]);

    $this->company = Company::factory()->create(['industry_id' => $this->industry->id, 'country_code' => 'KH']);
    $this->journey = Journey::factory()->create(['company_id' => $this->company->id, 'journey_template_id' => $this->template->id]);
});

// ─── Show ────────────────────────────────────────────────────────────────────

it('lets a company_owner view their own journey', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $response = $this->actingAs($owner)->getJson('/api/v1/journey');

    $response->assertOk()
        ->assertJsonPath('data.journey_template.id', $this->template->id)
        ->assertJsonCount(3, 'data.levels');

    // First level of each pillar unlocked by default; L3 (2nd in 'scale') is not.
    $levels = collect($response->json('data.levels'))->keyBy('code');
    expect($levels['L1']['unlocked'])->toBeTrue();
    expect($levels['L2']['unlocked'])->toBeTrue();
    expect($levels['L3']['unlocked'])->toBeFalse();
});

it('requires authentication to view a journey', function () {
    $this->getJson('/api/v1/journey')->assertUnauthorized();
});

// ─── Plan-based unlocking (journey activation by plan) ──────────────────────

it('caps unlocked levels to the industry\'s free package when the company has no active subscription', function () {
    Package::factory()->create([
        'industry_id' => $this->industry->id,
        'tier' => Tier::Free,
        'journey_level_id' => $this->l1->id,
    ]);
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $response = $this->actingAs($owner)->getJson('/api/v1/journey');

    // Without this Free package, L2 would already unlock as the first level
    // of its own pillar (see the unconfigured-industry test above) — the
    // plan cap is what pins it back to just L1 here.
    $levels = collect($response->json('data.levels'))->keyBy('code');
    expect($levels['L1']['unlocked'])->toBeTrue();
    expect($levels['L2']['unlocked'])->toBeFalse();
});

it('unlocks levels up to what the company\'s active subscription package entitles them to', function () {
    $package = Package::factory()->create([
        'industry_id' => $this->industry->id,
        'tier' => Tier::Pro,
        'journey_level_id' => $this->l2->id,
    ]);
    $subscription = Subscription::factory()->active()->create([
        'company_id' => $this->company->id,
        'package_id' => $package->id,
    ]);
    $this->company->update(['active_subscription_id' => $subscription->id]);
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $response = $this->actingAs($owner)->getJson('/api/v1/journey');

    $levels = collect($response->json('data.levels'))->keyBy('code');
    expect($levels['L1']['unlocked'])->toBeTrue();
    expect($levels['L2']['unlocked'])->toBeTrue();
    expect($levels['L3']['unlocked'])->toBeFalse();
});

it('still requires milestone completion within the subscription-capped range', function () {
    $package = Package::factory()->create([
        'industry_id' => $this->industry->id,
        'tier' => Tier::Pro,
        'journey_level_id' => $this->l3->id,
    ]);
    $subscription = Subscription::factory()->active()->create([
        'company_id' => $this->company->id,
        'package_id' => $package->id,
    ]);
    $this->company->update(['active_subscription_id' => $subscription->id]);
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    // Subscription entitles the company up to L3, but L2's milestones were
    // never completed — the milestone chain must still gate L3.
    $response = $this->actingAs($owner)->getJson('/api/v1/journey');

    $levels = collect($response->json('data.levels'))->keyBy('code');
    expect($levels['L2']['unlocked'])->toBeTrue();
    expect($levels['L3']['unlocked'])->toBeFalse();
});

it('returns 404 when the current company has no journey yet', function () {
    $otherCompany = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($otherCompany)->create();

    $this->actingAs($owner)->getJson('/api/v1/journey')->assertNotFound();
});

it('unlocks the next level once every milestone in the previous one is completed', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    app(CompleteMilestoneAction::class)->execute($this->company, $this->l2MilestoneA, null);
    app(CompleteMilestoneAction::class)->execute($this->company, $this->l2MilestoneB, null);

    $response = $this->actingAs($owner)->getJson('/api/v1/journey');

    $levels = collect($response->json('data.levels'))->keyBy('code');
    expect($levels['L3']['unlocked'])->toBeTrue();
    expect($levels['L2']['milestones'][0]['completed'])->toBeTrue();
});

it('nests real document status under each milestone', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $template = DocumentTemplate::factory()->create(['milestone_id' => $this->l1MilestoneA->id, 'name' => 'MoC Registration']);
    Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $template->id,
        'status' => 'verified',
    ]);
    $untouchedTemplate = DocumentTemplate::factory()->create(['milestone_id' => $this->l1MilestoneA->id, 'name' => 'Articles of Incorporation']);

    $response = $this->actingAs($owner)->getJson('/api/v1/journey');

    $levels = collect($response->json('data.levels'))->keyBy('code');
    $docs = collect($levels['L1']['milestones'][0]['documents'])->keyBy('name');

    expect($docs['MoC Registration']['status'])->toBe('verified');
    // Nothing uploaded yet for this one — "pending" is the derived absence
    // of a Document row, not a real DocumentStatus value.
    expect($docs['Articles of Incorporation']['status'])->toBe('pending');
});

it('includes global documents and only this company\'s own extras — never another company\'s', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $otherCompany = Company::factory()->create(['industry_id' => $this->industry->id, 'country_code' => 'KH']);

    DocumentTemplate::factory()->create(['milestone_id' => $this->l1MilestoneA->id, 'name' => 'Global Requirement']);
    DocumentTemplate::factory()->create(['milestone_id' => $this->l1MilestoneA->id, 'company_id' => $this->company->id, 'name' => 'My Extra']);
    DocumentTemplate::factory()->create(['milestone_id' => $this->l1MilestoneA->id, 'company_id' => $otherCompany->id, 'name' => 'Their Extra']);

    $response = $this->actingAs($owner)->getJson('/api/v1/journey');

    $levels = collect($response->json('data.levels'))->keyBy('code');
    $docNames = collect($levels['L1']['milestones'][0]['documents'])->pluck('name');

    expect($docNames)->toContain('Global Requirement', 'My Extra');
    expect($docNames)->not->toContain('Their Extra');
});

it('nests sub-documents in the company\'s own journey view instead of flattening them', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $root = DocumentTemplate::factory()->create(['milestone_id' => $this->l1MilestoneA->id, 'name' => 'Root Doc']);
    DocumentTemplate::factory()->create(['milestone_id' => $this->l1MilestoneA->id, 'parent_id' => $root->id, 'name' => 'Sub Doc']);

    $response = $this->actingAs($owner)->getJson('/api/v1/journey');

    $levels = collect($response->json('data.levels'))->keyBy('code');
    $docs = collect($levels['L1']['milestones'][0]['documents'])->keyBy('name');

    expect($docs['Root Doc']['children'])->toHaveCount(1);
    expect($docs['Root Doc']['children'][0]['name'])->toBe('Sub Doc');
});

// ─── Show for a specific company (back office) ──────────────────────────────

it('lets an admin view any company\'s journey by id', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson("/api/v1/journey/companies/{$this->company->id}");

    $response->assertOk()->assertJsonPath('data.journey_template.id', $this->template->id);
});

it('forbids a company_owner from viewing another company\'s journey by id', function () {
    $otherCompany = Company::factory()->create();
    Journey::factory()->create(['company_id' => $otherCompany->id, 'journey_template_id' => $this->template->id]);

    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    // The BelongsToCompany scope quietly restricts the lookup to the caller's
    // own company_id regardless of which {company} was requested — the
    // wrong-company request just finds nothing, same as any other
    // tenant-scoped lookup with a mismatched ID.
    $this->actingAs($owner)->getJson("/api/v1/journey/companies/{$otherCompany->id}")->assertNotFound();
});

it('requires authentication to view a company journey by id', function () {
    $this->getJson("/api/v1/journey/companies/{$this->company->id}")->assertUnauthorized();
});

// ─── Complete milestone (admin-signoff) ─────────────────────────────────────

it('lets an admin sign off a milestone', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson(
        "/api/v1/journey/companies/{$this->company->id}/milestones/{$this->l1MilestoneA->id}/complete",
    );

    $response->assertCreated()->assertJsonPath('data.trigger', 'admin_signoff');

    $this->assertDatabaseHas('milestone_completions', [
        'company_id' => $this->company->id,
        'milestone_id' => $this->l1MilestoneA->id,
    ]);
});

it('is idempotent when signing off an already-completed milestone', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/v1/journey/companies/{$this->company->id}/milestones/{$this->l1MilestoneA->id}/complete")->assertCreated();
    $this->actingAs($admin)->postJson("/api/v1/journey/companies/{$this->company->id}/milestones/{$this->l1MilestoneA->id}/complete")->assertCreated();

    expect(MilestoneCompletion::query()
        ->where('company_id', $this->company->id)
        ->where('milestone_id', $this->l1MilestoneA->id)
        ->count())->toBe(1);
});

it('forbids a company_owner from signing off their own milestone', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $this->actingAs($owner)->postJson(
        "/api/v1/journey/companies/{$this->company->id}/milestones/{$this->l1MilestoneA->id}/complete",
    )->assertForbidden();
});

it('requires authentication to sign off a milestone', function () {
    $this->postJson("/api/v1/journey/companies/{$this->company->id}/milestones/{$this->l1MilestoneA->id}/complete")
        ->assertUnauthorized();
});
