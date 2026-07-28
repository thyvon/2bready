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
