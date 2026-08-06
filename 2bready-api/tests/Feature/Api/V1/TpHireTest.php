<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/** A DocumentTemplate whose Milestone->JourneyLevel.code is pinned, not random. */
function documentTemplateAtLevel(string $code): DocumentTemplate
{
    $journeyLevel = JourneyLevel::factory()->create(['code' => $code]);
    $milestone = Milestone::factory()->create(['journey_level_id' => $journeyLevel->id]);

    return DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
}

/** A real Journey linking $company to a fresh JourneyTemplate — needed by
 *  /tp/companies/{id}/journey, which 404s without one (unlike the plain
 *  verify/reject-authorization tests above, which only need the
 *  Document -> DocumentTemplate -> Milestone -> JourneyLevel chain). */
function createCompanyJourney(Company $company): JourneyTemplate
{
    $template = JourneyTemplate::factory()->create();
    Journey::factory()->create(['company_id' => $company->id, 'journey_template_id' => $template->id]);

    return $template;
}

/** A Milestone at a given level code, under an existing JourneyTemplate.
 *  Pillar/sort_order derived from the code (not JourneyLevelFactory's random
 *  pillar) so each level is deterministically its own pillar's first/only
 *  level — i.e. always unlocked under the fail-open "no packages configured"
 *  default — unless a test deliberately wants two levels in the same
 *  pillar to exercise real lock-gating, which should build those inline.
 *  Cycles through the 3 real pillars by level number rather than a fixed
 *  L2/L3/L4 lookup, so this keeps working unchanged if a future L5+ level
 *  is ever added to the real taxonomy. */
function milestoneAtLevel(JourneyTemplate $template, string $code): Milestone
{
    $pillars = ['comply', 'scale', 'lead'];
    $levelNumber = (int) substr($code, 1);
    $level = JourneyLevel::factory()->create([
        'journey_template_id' => $template->id,
        'code' => $code,
        'pillar' => $pillars[($levelNumber - 1) % count($pillars)],
        'sort_order' => $levelNumber,
    ]);

    return Milestone::factory()->create(['journey_level_id' => $level->id]);
}

// ─── Create (admin) ──────────────────────────────────────────────────────────

it('lets an admin create a TP hire with a snapshotted price and commission split', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create(['price_l3_cents' => 39900]);

    $response = $this->actingAs($admin)->postJson('/api/v1/tp-hires', [
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.tp_hire.status', 'pending_payment')
        ->assertJsonPath('data.tp_hire.price_agreed_cents', 39900)
        ->assertJsonPath('data.tp_hire.platform_commission_cents', (int) round(39900 * 0.15))
        ->assertJsonPath('data.tp_hire.tp_payout_cents', 39900 - (int) round(39900 * 0.15))
        ->assertJsonPath('data.payment.status', 'pending')
        ->assertJsonPath('data.payment.amount_cents', 39900)
        ->assertJsonPath('data.payment.payable_type', 'tp_hire')
        ->assertJsonStructure(['data' => ['gateway_data' => ['bank_name', 'account_number', 'reference']]]);

    // Price change on the firm afterward must never retroactively affect this hire.
    $tpPartner->update(['price_l3_cents' => 99900]);
    $hire = TpHire::where('company_id', $company->id)->first();
    expect($hire->price_agreed_cents)->toBe(39900);
});

it('forbids a company_owner from creating a TP hire', function () {
    $owner = User::factory()->companyOwner()->create();
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();

    $this->actingAs($owner)->postJson('/api/v1/tp-hires', [
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ])->assertForbidden();
});

it('rejects creating a hire for a level the firm has no price for', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create(['price_l4_cents' => null]);

    $this->actingAs($admin)->postJson('/api/v1/tp-hires', [
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L4',
        'method' => 'manual_bank_transfer',
    ])->assertUnprocessable();
});

// ─── Create (self-service) ──────────────────────────────────────────────────

it('lets a company_owner hire a TP firm for their own company via bank transfer', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $tpPartner = TpPartner::factory()->create(['price_l3_cents' => 39900]);
    milestoneAtLevel(createCompanyJourney($company), 'L3');

    $response = $this->actingAs($owner)->postJson('/api/v1/tp-hires/hire', [
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.tp_hire.company_id', $company->id)
        ->assertJsonPath('data.tp_hire.status', 'pending_payment')
        ->assertJsonPath('data.tp_hire.price_agreed_cents', 39900)
        ->assertJsonPath('data.payment.status', 'pending')
        ->assertJsonPath('data.payment.payable_type', 'tp_hire')
        ->assertJsonStructure(['data' => ['gateway_data' => ['bank_name', 'account_number', 'reference']]]);

    expect(TpHire::where('company_id', $company->id)->first()->assigned_by_user_id)->toBe($owner->id);
});

it("ignores a client-supplied company_id and uses the caller's own company", function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $otherCompany = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    milestoneAtLevel(createCompanyJourney($company), 'L3');

    $response = $this->actingAs($owner)->postJson('/api/v1/tp-hires/hire', [
        'company_id' => $otherCompany->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ]);

    $response->assertCreated()->assertJsonPath('data.tp_hire.company_id', $company->id);
    expect(TpHire::where('company_id', $otherCompany->id)->exists())->toBeFalse();
});

it('rejects a self-service hire with an invalid journey_level', function () {
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();
    $tpPartner = TpPartner::factory()->create();

    $this->actingAs($owner)->postJson('/api/v1/tp-hires/hire', [
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L9',
        'method' => 'manual_bank_transfer',
    ])->assertUnprocessable()->assertJsonValidationErrors(['journey_level']);
});

it('rejects a self-service hire missing tp_partner_id', function () {
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();

    $this->actingAs($owner)->postJson('/api/v1/tp-hires/hire', [
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ])->assertUnprocessable()->assertJsonValidationErrors(['tp_partner_id']);
});

it('rejects a self-service hire for a level the firm has no price for', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $tpPartner = TpPartner::factory()->create(['price_l4_cents' => null]);
    // L4 is unlocked here — the point of this test is the "no price" business
    // rule specifically, not the journey-lock check exercised separately below.
    milestoneAtLevel(createCompanyJourney($company), 'L4');

    $this->actingAs($owner)->postJson('/api/v1/tp-hires/hire', [
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L4',
        'method' => 'manual_bank_transfer',
    ])->assertUnprocessable();
});

it('rejects a self-service hire for a journey level the company has not unlocked yet', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $tpPartner = TpPartner::factory()->create();

    // L2 and L3 deliberately share a pillar — L3 stays locked until L2's
    // milestone is completed for this company, which we never do here.
    $template = createCompanyJourney($company);
    $levelL2 = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L2', 'pillar' => 'comply', 'sort_order' => 1]);
    Milestone::factory()->create(['journey_level_id' => $levelL2->id]);
    $levelL3 = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L3', 'pillar' => 'comply', 'sort_order' => 2]);
    Milestone::factory()->create(['journey_level_id' => $levelL3->id]);

    $this->actingAs($owner)->postJson('/api/v1/tp-hires/hire', [
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ])->assertUnprocessable()->assertJsonValidationErrors(['journey_level']);
});

it('forbids a company_owner with no company from self-service hiring', function () {
    $owner = User::factory()->companyOwner()->create();
    $tpPartner = TpPartner::factory()->create();

    $this->actingAs($owner)->postJson('/api/v1/tp-hires/hire', [
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ])->assertForbidden();
});

it('forbids a non-company_owner role from self-service hiring', function () {
    $staff = User::factory()->withRole('staff')->create();
    $tpPartner = TpPartner::factory()->create();

    $this->actingAs($staff)->postJson('/api/v1/tp-hires/hire', [
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ])->assertForbidden();
});

it('requires authentication for self-service hiring', function () {
    $tpPartner = TpPartner::factory()->create();

    $this->postJson('/api/v1/tp-hires/hire', [
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ])->assertUnauthorized();
});

it('still forbids a company_owner from creating a TP hire via the admin route', function () {
    // Regression guard — the self-service route above must never replace or
    // widen store()'s admin-only gate; the two entry points stay isolated.
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();

    $this->actingAs($owner)->postJson('/api/v1/tp-hires', [
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ])->assertForbidden();
});

it('lets a company_owner list only their own TP hires', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $otherCompany = Company::factory()->create();

    TpHire::factory()->create(['company_id' => $company->id]);
    TpHire::factory()->create(['company_id' => $otherCompany->id]);

    $response = $this->actingAs($owner)->getJson('/api/v1/tp-hires')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    $response->assertJsonPath('data.0.company_id', $company->id);
});

// ─── Full flow: create → pay → confirm → activate → TP reviews ─────────────────

it('activates the hire once the company pays and admin confirms, and the TP can then verify a document', function () {
    $admin = User::factory()->admin()->create();
    $finance = User::factory()->withRole('finance')->create();
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $create = $this->actingAs($admin)->postJson('/api/v1/tp-hires', [
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ])->assertCreated();

    $hireId = $create->json('data.tp_hire.id');
    $paymentId = $create->json('data.payment.id');

    // Before payment, the TP has nothing to see yet.
    $this->actingAs($auditor)->getJson('/api/v1/tp/companies')->assertOk()->assertJsonCount(0, 'data');

    $this->actingAs($owner)->postJson("/api/v1/payments/{$paymentId}/submit")
        ->assertOk()->assertJsonPath('data.status', 'awaiting_confirmation');

    $this->actingAs($finance)->postJson("/api/v1/payments/{$paymentId}/confirm")
        ->assertOk()->assertJsonPath('data.status', 'confirmed');

    expect(TpHire::find($hireId)->status->value)->toBe('active');

    // Now the TP sees the company.
    $this->actingAs($auditor)->getJson('/api/v1/tp/companies')
        ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $company->id);

    $journeyTemplate = createCompanyJourney($company);
    $milestone = milestoneAtLevel($journeyTemplate, 'L3');
    $template = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
        'status' => 'review',
    ]);

    $journeyResponse = $this->actingAs($auditor)->getJson("/api/v1/tp/companies/{$company->id}/journey")
        ->assertOk();

    $levels = collect($journeyResponse->json('data.levels'))->keyBy('code');
    // Hired for L3 only — the tree contains just that level, nothing else.
    expect($levels)->toHaveCount(1);
    expect($levels['L3']['milestones'][0]['documents'][0]['status'])->toBe('review');

    $this->actingAs($auditor)->postJson("/api/v1/documents/{$document->id}/verify")
        ->assertOk()->assertJsonPath('data.status', 'verified');
});

it('forbids a TP from seeing or reviewing a company they have no active hire for', function () {
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();
    $otherCompany = Company::factory()->create();

    $this->actingAs($auditor)->getJson("/api/v1/tp/companies/{$otherCompany->id}/journey")->assertForbidden();

    $template = DocumentTemplate::factory()->create();
    $document = Document::factory()->create([
        'company_id' => $otherCompany->id,
        'document_template_id' => $template->id,
        'status' => 'review',
    ]);

    $this->actingAs($auditor)->postJson("/api/v1/documents/{$document->id}/verify")->assertForbidden();
});

it('forbids a TP from reviewing a document once their hire is only pending_payment, not active', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    TpHire::factory()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'status' => 'pending_payment',
    ]);

    $template = DocumentTemplate::factory()->create();
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
        'status' => 'review',
    ]);

    $this->actingAs($auditor)->postJson("/api/v1/documents/{$document->id}/verify")->assertForbidden();
});

it('lets an assigned TP reject a document with a reason, stamping rejected_by_user_id', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
    ]);

    $template = documentTemplateAtLevel('L3');
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
        'status' => 'review',
    ]);

    $this->actingAs($auditor)->postJson("/api/v1/documents/{$document->id}/reject", ['reason' => 'Illegible scan.'])
        ->assertOk()
        ->assertJsonPath('data.status', 'rejected')
        ->assertJsonPath('data.rejected_by_user_id', $auditor->id);
});

it('forbids a TP from reviewing a document at a journey level their hire does not cover', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    // Hired for L2 only — must not be able to touch this company's L3 documents.
    TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L2',
    ]);

    $template = documentTemplateAtLevel('L3');
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
        'status' => 'review',
    ]);

    $this->actingAs($auditor)->postJson("/api/v1/documents/{$document->id}/verify")->assertForbidden();
});

it('lets an assigned TP preview a document at their hired level', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L2',
    ]);

    $template = documentTemplateAtLevel('L2');
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
        'status' => 'review',
    ]);

    $this->actingAs($auditor)->getJson("/api/v1/documents/{$document->id}/preview-url")
        ->assertOk()
        ->assertJsonStructure(['data' => ['url', 'mime_type', 'original_filename']]);
});

it('forbids a TP from previewing a document outside their hired level or company', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L2',
    ]);

    $wrongLevelTemplate = documentTemplateAtLevel('L3');
    $wrongLevelDocument = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $wrongLevelTemplate->id,
    ]);
    $this->actingAs($auditor)->getJson("/api/v1/documents/{$wrongLevelDocument->id}/preview-url")->assertForbidden();

    $wrongCompanyTemplate = documentTemplateAtLevel('L2');
    $wrongCompanyDocument = Document::factory()->create([
        'company_id' => $otherCompany->id,
        'document_template_id' => $wrongCompanyTemplate->id,
    ]);
    $this->actingAs($auditor)->getJson("/api/v1/documents/{$wrongCompanyDocument->id}/preview-url")->assertForbidden();
});

it('scopes the journey tree to only the level(s) a TP firm is actively hired for', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $journeyTemplate = createCompanyJourney($company);
    $l2Milestone = milestoneAtLevel($journeyTemplate, 'L2');
    $l3Milestone = milestoneAtLevel($journeyTemplate, 'L3');
    DocumentTemplate::factory()->create(['milestone_id' => $l2Milestone->id, 'name' => 'L2 doc']);
    DocumentTemplate::factory()->create(['milestone_id' => $l3Milestone->id, 'name' => 'L3 doc']);

    // Hired for L2 only, even though the company's journey also has an L3.
    TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L2',
    ]);

    $response = $this->actingAs($auditor)->getJson("/api/v1/tp/companies/{$company->id}/journey")->assertOk();

    $levels = collect($response->json('data.levels'))->keyBy('code');
    expect($levels)->toHaveCount(1);
    expect($levels)->toHaveKey('L2');
    expect($levels)->not->toHaveKey('L3');
});

it('excludes a hired level from the journey tree while the company hasn\'t unlocked it yet', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $journeyTemplate = createCompanyJourney($company);
    // Same pillar, sequential sort_order — L3 only unlocks once every one
    // of L2's milestones has a completion for this company (see
    // JourneyProgressService). Neither milestone is completed here, so L3
    // stays locked even though the firm is hired for it.
    $l2 = JourneyLevel::factory()->create(['journey_template_id' => $journeyTemplate->id, 'code' => 'L2', 'pillar' => 'comply', 'sort_order' => 1]);
    $l3 = JourneyLevel::factory()->create(['journey_template_id' => $journeyTemplate->id, 'code' => 'L3', 'pillar' => 'comply', 'sort_order' => 2]);
    Milestone::factory()->create(['journey_level_id' => $l2->id]);
    Milestone::factory()->create(['journey_level_id' => $l3->id]);

    // Hired for both — the gap being tested is "hired but not yet unlocked",
    // not "not hired".
    TpHire::factory()->active()->create(['company_id' => $company->id, 'tp_partner_id' => $tpPartner->id, 'journey_level' => 'L2']);
    TpHire::factory()->active()->create(['company_id' => $company->id, 'tp_partner_id' => $tpPartner->id, 'journey_level' => 'L3']);

    $response = $this->actingAs($auditor)->getJson("/api/v1/tp/companies/{$company->id}/journey")->assertOk();

    $levels = collect($response->json('data.levels'))->keyBy('code');
    expect($levels)->toHaveKey('L2');
    expect($levels)->not->toHaveKey('L3');
});

it('returns 404 for a hired company that has no journey yet', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L2',
    ]);

    $this->actingAs($auditor)->getJson("/api/v1/tp/companies/{$company->id}/journey")->assertNotFound();
});

// Regression guard: admin/staff must remain unrestricted after the
// class-level -> instance-level authorize() change.
it('still lets an admin verify any document regardless of TP hires', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $template = DocumentTemplate::factory()->create();
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
        'status' => 'review',
    ]);

    $this->actingAs($admin)->postJson("/api/v1/documents/{$document->id}/verify")
        ->assertOk()->assertJsonPath('data.status', 'verified');
});

// ─── Complete / payout ───────────────────────────────────────────────────────

it('lets admin or the assigned TP mark a hire completed, and only admin mark it paid out', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();
    $admin = User::factory()->admin()->create();

    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
    ]);

    $this->actingAs($auditor)->postJson("/api/v1/tp-hires/{$hire->id}/complete")
        ->assertOk()->assertJsonPath('data.status', 'completed');

    $this->actingAs($auditor)->postJson("/api/v1/tp-hires/{$hire->id}/mark-paid-out")->assertForbidden();

    $this->actingAs($admin)->postJson("/api/v1/tp-hires/{$hire->id}/mark-paid-out")
        ->assertOk()->assertJsonPath('data.payout_status', 'paid_out');
});

it('requires authentication for every tp-hire endpoint', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();

    $this->postJson('/api/v1/tp-hires', [
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
        'method' => 'manual_bank_transfer',
    ])->assertUnauthorized();

    $this->getJson('/api/v1/tp/companies')->assertUnauthorized();
});

// ─── Cancel (marketplace unhire) ─────────────────────────────────────────────

it('lets a company_owner cancel their own pending hire, failing its open payment', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $tpPartner = TpPartner::factory()->create();

    $hire = TpHire::factory()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
    ]);
    $hire->payments()->create([
        'company_id' => $company->id,
        'amount_cents' => $hire->price_agreed_cents,
        'currency' => 'USD',
        'method' => 'manual_bank_transfer',
        'status' => 'pending',
        'gateway_reference' => 'PAYTEST01',
    ]);

    $response = $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled');

    expect($response->json('data.cancelled_at'))->not->toBeNull();
    expect($hire->payments()->first()->status->value)->toBe('failed');
});

it('strips a TP firm of access the moment their active hire is cancelled', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $admin = User::factory()->admin()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
    ]);

    $this->actingAs($auditor)->getJson('/api/v1/tp/companies')->assertJsonCount(1, 'data');

    // Self-service cancel is closed once money moved — the owner gets a
    // 403; only admin may cancel an active (paid) engagement.
    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")->assertForbidden();

    $this->actingAs($admin)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")->assertOk();

    $this->actingAs($auditor)->getJson('/api/v1/tp/companies')->assertJsonCount(0, 'data');
});

it('does not touch a confirmed payment when an active hire is cancelled', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->admin()->create();
    $tpPartner = TpPartner::factory()->create();

    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
    ]);
    $payment = $hire->payments()->create([
        'company_id' => $company->id,
        'amount_cents' => $hire->price_agreed_cents,
        'currency' => 'USD',
        'method' => 'manual_bank_transfer',
        'status' => 'confirmed',
        'gateway_reference' => 'PAYTEST02',
    ]);

    $this->actingAs($admin)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")->assertOk();

    expect($payment->fresh()->status->value)->toBe('confirmed');
});

it('forbids a company_owner from self-cancelling once the payment is confirmed', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $tpPartner = TpPartner::factory()->create();

    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
    ]);
    $hire->payments()->create([
        'company_id' => $company->id,
        'amount_cents' => $hire->price_agreed_cents,
        'currency' => 'USD',
        'method' => 'manual_bank_transfer',
        'status' => 'confirmed',
        'gateway_reference' => 'PAYTEST04',
    ]);

    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")->assertForbidden();

    expect($hire->fresh()->status->value)->toBe('active');
});

it('cannot resurrect a cancelled hire by confirming its payment afterwards', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $finance = User::factory()->withRole('finance')->create();
    $tpPartner = TpPartner::factory()->create();

    $hire = TpHire::factory()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
    ]);
    $payment = $hire->payments()->create([
        'company_id' => $company->id,
        'amount_cents' => $hire->price_agreed_cents,
        'currency' => 'USD',
        'method' => 'manual_bank_transfer',
        'status' => 'pending',
        'gateway_reference' => 'PAYTEST03',
    ]);

    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")->assertOk();
    $this->actingAs($owner)->postJson("/api/v1/payments/{$payment->id}/submit")->assertOk();

    $this->actingAs($finance)->postJson("/api/v1/payments/{$payment->id}/confirm")->assertOk();

    expect(TpHire::find($hire->id)->status->value)->toBe('cancelled');
});

it('forbids cancelling a hire that already completed', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $admin = User::factory()->admin()->create();
    $tpPartner = TpPartner::factory()->create();

    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'status' => 'completed',
    ]);

    // Self-service: the completed state is terminal, so the company's right
    // never even opens — policy rejects before the action runs.
    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")->assertForbidden();

    // Back-office: policy opens for admin, the action still refuses — the
    // terminal-status rule lives in the domain, not the permission layer.
    $this->actingAs($admin)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")->assertUnprocessable();
    expect($hire->fresh()->status->value)->toBe('completed');
});

it('hides another company\'s hire from a company_owner cancelling (404, not 403)', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $otherCompany = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();

    $hire = TpHire::factory()->create([
        'company_id' => $otherCompany->id,
        'tp_partner_id' => $tpPartner->id,
    ]);

    // Tenant isolation: the scoped binding makes the other company's hire
    // invisible — 404 (can't even probe its existence), not 403.
    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")->assertNotFound();
});

it('lets an admin cancel a hire as the back-office override', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->admin()->create();
    $tpPartner = TpPartner::factory()->create();

    $hire = TpHire::factory()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
    ]);

    $this->actingAs($admin)->postJson("/api/v1/tp-hires/{$hire->id}/cancel")
        ->assertOk()->assertJsonPath('data.status', 'cancelled');
});

it('requires authentication to cancel a hire', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $hire = TpHire::factory()->create(['company_id' => $company->id, 'tp_partner_id' => $tpPartner->id]);

    $this->postJson("/api/v1/tp-hires/{$hire->id}/cancel")->assertUnauthorized();
});
