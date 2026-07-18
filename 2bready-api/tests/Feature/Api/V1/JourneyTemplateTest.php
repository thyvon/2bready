<?php

declare(strict_types=1);

use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Industry\Models\Industry;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Journey templates ───────────────────────────────────────────────────────

it('lets an admin list journey templates', function () {
    JourneyTemplate::factory()->count(2)->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/v1/journey-templates')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('requires authentication to list journey templates', function () {
    $this->getJson('/api/v1/journey-templates')->assertUnauthorized();
});

it('forbids finance from listing journey templates', function () {
    $finance = User::factory()->withRole('finance')->create();

    $this->actingAs($finance)->getJson('/api/v1/journey-templates')->assertForbidden();
});

it('lets an admin create a journey template', function () {
    $industry = Industry::factory()->create();
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/journey-templates', [
        'country_code' => 'VN',
        'industry_id' => $industry->id,
        'name' => 'Vietnam F&B Journey',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.country_code', 'VN')
        ->assertJsonPath('data.industry_id', $industry->id);
});

it('rejects a duplicate country_code + industry_id combination', function () {
    $industry = Industry::factory()->create();
    JourneyTemplate::factory()->create(['country_code' => 'KH', 'industry_id' => $industry->id]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/journey-templates', [
        'country_code' => 'KH',
        'industry_id' => $industry->id,
        'name' => 'Duplicate',
    ])->assertUnprocessable()->assertJsonValidationErrors(['country_code']);
});

it('forbids staff without journey_template.manage from creating — company_owner rejected', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->postJson('/api/v1/journey-templates', [
        'country_code' => 'VN',
        'industry_id' => Industry::factory()->create()->id,
        'name' => 'Vietnam',
    ])->assertForbidden();
});

it('shows a journey template with its nested levels, milestones, and document templates', function () {
    $template = JourneyTemplate::factory()->create();
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'sort_order' => 1]);
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson("/api/v1/journey-templates/{$template->id}");

    $response->assertOk()
        ->assertJsonPath('data.levels.0.id', $level->id)
        ->assertJsonPath('data.levels.0.milestones.0.id', $milestone->id)
        ->assertJsonCount(1, 'data.levels.0.milestones.0.document_templates');
});

it('lets an admin update a journey template', function () {
    $template = JourneyTemplate::factory()->create(['name' => 'Old Name']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/journey-templates/{$template->id}", [
        'name' => 'New Name',
    ])->assertOk()->assertJsonPath('data.name', 'New Name');
});

it('lets an admin delete an unused journey template', function () {
    $template = JourneyTemplate::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->deleteJson("/api/v1/journey-templates/{$template->id}")->assertNoContent();

    $this->assertSoftDeleted('journey_templates', ['id' => $template->id]);
});

it('blocks deleting a journey template that a company is actively using', function () {
    $template = JourneyTemplate::factory()->create();
    Journey::factory()->create(['journey_template_id' => $template->id]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->deleteJson("/api/v1/journey-templates/{$template->id}")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['journey_template']);

    $this->assertDatabaseHas('journey_templates', ['id' => $template->id, 'deleted_at' => null]);
});

// ─── Journey levels (nested under a template) ────────────────────────────────

it('lets an admin add a level to a journey template', function () {
    $template = JourneyTemplate::factory()->create();
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson("/api/v1/journey-templates/{$template->id}/levels", [
        'code' => 'L1',
        'name' => 'Bronze',
        'pathway_name' => 'Foundational Compliance',
        'pillar' => 'comply',
        'sort_order' => 1,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.code', 'L1')
        ->assertJsonPath('data.journey_template_id', $template->id);
});

it('rejects a duplicate level code within the same template', function () {
    $template = JourneyTemplate::factory()->create();
    JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L1']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/v1/journey-templates/{$template->id}/levels", [
        'code' => 'L1',
        'name' => 'Bronze Again',
        'pathway_name' => 'Foundational Compliance',
        'pillar' => 'comply',
    ])->assertUnprocessable()->assertJsonValidationErrors(['code']);
});

it('rejects an invalid pillar value', function () {
    $template = JourneyTemplate::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/v1/journey-templates/{$template->id}/levels", [
        'code' => 'L1',
        'name' => 'Bronze',
        'pathway_name' => 'Foundational Compliance',
        'pillar' => 'not-a-real-pillar',
    ])->assertUnprocessable()->assertJsonValidationErrors(['pillar']);
});

it('lets an admin update and delete a journey level', function () {
    $level = JourneyLevel::factory()->create(['name' => 'Old Name']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/journey-levels/{$level->id}", [
        'name' => 'New Name',
    ])->assertOk()->assertJsonPath('data.name', 'New Name');

    $this->actingAs($admin)->deleteJson("/api/v1/journey-levels/{$level->id}")->assertNoContent();
    $this->assertSoftDeleted('journey_levels', ['id' => $level->id]);
});

// ─── Milestones (nested under a level) ───────────────────────────────────────

it('lets an admin add a milestone to a journey level', function () {
    $level = JourneyLevel::factory()->create();
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson("/api/v1/journey-levels/{$level->id}/milestones", [
        'name' => 'Register Business',
        'sort_order' => 1,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Register Business')
        ->assertJsonPath('data.journey_level_id', $level->id);
});

it('lets an admin update and delete a milestone', function () {
    $milestone = Milestone::factory()->create(['name' => 'Old Name']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/milestones/{$milestone->id}", [
        'name' => 'New Name',
    ])->assertOk()->assertJsonPath('data.name', 'New Name');

    $this->actingAs($admin)->deleteJson("/api/v1/milestones/{$milestone->id}")->assertNoContent();
    $this->assertSoftDeleted('milestones', ['id' => $milestone->id]);
});

it('forbids an auditor from creating a milestone', function () {
    $level = JourneyLevel::factory()->create();
    $auditor = User::factory()->withRole('auditor')->create();

    $this->actingAs($auditor)->postJson("/api/v1/journey-levels/{$level->id}/milestones", [
        'name' => 'Register Business',
    ])->assertForbidden();
});
