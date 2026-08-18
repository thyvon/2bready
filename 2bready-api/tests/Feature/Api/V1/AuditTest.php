<?php

declare(strict_types=1);

use App\Domain\Audit\Models\Audit;
use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Models\MilestoneCompletion;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/** A JourneyTemplate with a Journey attached to $company. */
function auditJourney(Company $company): JourneyTemplate
{
    $template = JourneyTemplate::factory()->create();
    Journey::factory()->create(['company_id' => $company->id, 'journey_template_id' => $template->id]);

    return $template;
}

/** A TpHire (active) + a firm + the firm's auditor, all wired together. */
function auditFixture(): array
{
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();
    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
    ]);

    return compact('company', 'tpPartner', 'auditor', 'hire');
}

function createAudit(TpHire $hire): Audit
{
    return Audit::create([
        'company_id' => $hire->company_id,
        'tp_hire_id' => $hire->id,
        'journey_level' => $hire->journey_level,
        'status' => 'pending',
    ]);
}

// ─── Create (admin) ──────────────────────────────────────────────────────────

it('lets an admin create an audit against an active hire', function () {
    $admin = User::factory()->admin()->create();
    ['company' => $company, 'hire' => $hire] = auditFixture();

    $response = $this->actingAs($admin)->postJson('/api/v1/audits', [
        'tp_hire_id' => $hire->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.company_id', $company->id)
        ->assertJsonPath('data.tp_hire_id', $hire->id)
        ->assertJsonPath('data.journey_level', 'L3')
        ->assertJsonPath('data.status', 'pending');
});

it('rejects creating an audit for a hire still pending payment', function () {
    $admin = User::factory()->admin()->create();
    ['hire' => $hire] = auditFixture();
    $hire->update(['status' => 'pending_payment']);

    $this->actingAs($admin)->postJson('/api/v1/audits', [
        'tp_hire_id' => $hire->id,
    ])->assertStatus(422);
});

it('rejects creating a second audit for the same hire', function () {
    $admin = User::factory()->admin()->create();
    ['hire' => $hire] = auditFixture();
    createAudit($hire);

    $this->actingAs($admin)->postJson('/api/v1/audits', [
        'tp_hire_id' => $hire->id,
    ])->assertStatus(422);
});

it('requires an existing tp_hire_id', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/audits', [])->assertUnprocessable();
});

it('forbids a company_owner from creating an audit', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    ['hire' => $hire] = auditFixture();

    $this->actingAs($owner)->postJson('/api/v1/audits', ['tp_hire_id' => $hire->id])->assertForbidden();
});

it('requires authentication for every audit endpoint', function () {
    $this->getJson('/api/v1/audits')->assertUnauthorized();
    $this->postJson('/api/v1/audits', [])->assertUnauthorized();
});

// ─── Assign (admin) ──────────────────────────────────────────────────────────

it('lets an admin assign an auditor from the hired firm', function () {
    $admin = User::factory()->admin()->create();
    ['auditor' => $auditor, 'hire' => $hire] = auditFixture();
    $audit = createAudit($hire);

    $response = $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/assign", [
        'auditor_id' => $auditor->auditor->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'in_progress')
        ->assertJsonPath('data.auditor_id', $auditor->auditor->id);
    expect($audit->fresh()->assigned_at)->not->toBeNull();
});

it('rejects assigning an auditor from a different firm than the one hired', function () {
    $admin = User::factory()->admin()->create();
    $otherFirm = TpPartner::factory()->create();
    $otherAuditor = User::factory()->withTpPartner($otherFirm)->create();
    ['hire' => $hire] = auditFixture();
    $audit = createAudit($hire);

    $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/assign", [
        'auditor_id' => $otherAuditor->auditor->id,
    ])->assertStatus(422);
});

it('rejects assigning an auditor to an already-assigned audit', function () {
    $admin = User::factory()->admin()->create();
    ['auditor' => $auditor, 'hire' => $hire] = auditFixture();
    $audit = createAudit($hire);
    $audit->update(['auditor_id' => $auditor->auditor->id, 'status' => 'in_progress', 'assigned_at' => now()]);

    $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/assign", [
        'auditor_id' => $auditor->auditor->id,
    ])->assertStatus(422);
});

it('forbids a company_owner from assigning an auditor', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    ['auditor' => $auditor, 'hire' => $hire] = auditFixture();
    $audit = createAudit($hire);

    $this->actingAs($owner)->postJson("/api/v1/audits/{$audit->id}/assign", [
        'auditor_id' => $auditor->auditor->id,
    ])->assertForbidden();
});

// ─── Submit (assigned auditor) ───────────────────────────────────────────────

it('lets the assigned auditor submit findings', function () {
    $admin = User::factory()->admin()->create();
    ['auditor' => $auditor, 'hire' => $hire] = auditFixture();
    $audit = createAudit($hire);
    $audit->update(['auditor_id' => $auditor->auditor->id, 'status' => 'in_progress', 'assigned_at' => now()]);

    $response = $this->actingAs($auditor)->postJson("/api/v1/audits/{$audit->id}/submit", [
        'score' => 85,
        'feedback' => 'Evidence reviewed, minor gaps in internal rules.',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'submitted')
        ->assertJsonPath('data.score', 85)
        ->assertJsonPath('data.feedback', 'Evidence reviewed, minor gaps in internal rules.');
    expect($audit->fresh()->submitted_at)->not->toBeNull();
});

it('forbids a firm auditor who is not the assigned one from submitting', function () {
    $tpPartner = TpPartner::factory()->create();
    $assigned = User::factory()->withTpPartner($tpPartner)->create();
    $colleague = User::factory()->withTpPartner($tpPartner)->create();
    $company = Company::factory()->create();
    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
    ]);
    $audit = createAudit($hire);
    $audit->update(['auditor_id' => $assigned->auditor->id, 'status' => 'in_progress', 'assigned_at' => now()]);

    $this->actingAs($colleague)->postJson("/api/v1/audits/{$audit->id}/submit", ['score' => 85])
        ->assertForbidden();
});

it('rejects submitting a pending (unassigned) audit — the auditor is not yet assigned', function () {
    ['auditor' => $auditor, 'hire' => $hire] = auditFixture();
    $audit = createAudit($hire);

    // No auditor has been assigned yet, so no one passes AuditPolicy::submit
    // (which requires the individually assigned auditor) — 403, not a state 422.
    $this->actingAs($auditor)->postJson("/api/v1/audits/{$audit->id}/submit", ['score' => 85])
        ->assertForbidden();
});

it('validates the submitted score range', function () {
    ['auditor' => $auditor, 'hire' => $hire] = auditFixture();
    $audit = createAudit($hire);
    $audit->update(['auditor_id' => $auditor->auditor->id, 'status' => 'in_progress', 'assigned_at' => now()]);

    $this->actingAs($auditor)->postJson("/api/v1/audits/{$audit->id}/submit", ['score' => 101])
        ->assertUnprocessable()->assertJsonValidationErrors(['score']);

    $this->actingAs($auditor)->postJson("/api/v1/audits/{$audit->id}/submit", ['score' => -1])
        ->assertUnprocessable()->assertJsonValidationErrors(['score']);
});

it('forbids an admin from submitting an audit', function () {
    $admin = User::factory()->admin()->create();
    ['auditor' => $auditor, 'hire' => $hire] = auditFixture();
    $audit = createAudit($hire);
    $audit->update(['auditor_id' => $auditor->auditor->id, 'status' => 'in_progress', 'assigned_at' => now()]);

    $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/submit", ['score' => 85])
        ->assertForbidden();
});

// ─── Review (admin approve / reject) ─────────────────────────────────────────

it('lets an admin approve a submitted audit, recalculating the compliance score', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();
    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
    ]);

    // One required template at L3, verified — so the recalculated score is 100.
    $template = auditJourney($company);
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L3', 'pillar' => 'scale', 'sort_order' => 3]);
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    $docTemplate = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
    Document::factory()->verified()->create([
        'company_id' => $company->id,
        'document_template_id' => $docTemplate->id,
    ]);

    $audit = createAudit($hire);
    $audit->update(['auditor_id' => $auditor->auditor->id, 'status' => 'in_progress', 'assigned_at' => now()]);
    $audit->update(['status' => 'submitted', 'score' => 60, 'submitted_at' => now()]);

    $response = $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/review", [
        'decision' => 'approved',
    ]);

    $response->assertOk()->assertJsonPath('data.status', 'approved');

    // Score recalculated from evidence (verified docs), not the submitted 60.
    expect($audit->fresh()->score)->toBe(100);
    expect($company->fresh()->compliance_score)->toBe(100);
    // The audited milestone completed via the AuditApproval trigger.
    expect(MilestoneCompletion::where('company_id', $company->id)->where('milestone_id', $milestone->id)->exists())->toBeTrue();
});

it('lets an admin reject a submitted audit with no score side effects', function () {
    $admin = User::factory()->admin()->create();
    ['auditor' => $auditor, 'company' => $company, 'hire' => $hire] = auditFixture();
    $audit = createAudit($hire);
    $audit->update(['auditor_id' => $auditor->auditor->id, 'status' => 'in_progress', 'assigned_at' => now()]);
    $audit->update(['status' => 'submitted', 'score' => 40, 'submitted_at' => now()]);

    $response = $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/review", [
        'decision' => 'rejected',
    ]);

    $response->assertOk()->assertJsonPath('data.status', 'rejected');
    expect($company->fresh()->compliance_score)->toBe(0);
    expect($audit->fresh()->reviewed_at)->not->toBeNull();
});

it('forbids reviewing an audit that has not been submitted', function () {
    $admin = User::factory()->admin()->create();
    ['hire' => $hire] = auditFixture();
    $audit = createAudit($hire);

    $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/review", ['decision' => 'approved'])
        ->assertStatus(422);
});

it('validates the review decision value', function () {
    $admin = User::factory()->admin()->create();
    ['hire' => $hire] = auditFixture();
    $audit = createAudit($hire);

    $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/review", ['decision' => 'maybe'])
        ->assertUnprocessable()->assertJsonValidationErrors(['decision']);
});

it('forbids an auditor from reviewing an audit', function () {
    ['auditor' => $auditor, 'hire' => $hire] = auditFixture();
    $audit = createAudit($hire);
    $audit->update(['status' => 'submitted', 'submitted_at' => now()]);

    $this->actingAs($auditor)->postJson("/api/v1/audits/{$audit->id}/review", ['decision' => 'approved'])
        ->assertForbidden();
});

// ─── Cancel (admin) ──────────────────────────────────────────────────────────

it('lets an admin cancel a pending audit', function () {
    $admin = User::factory()->admin()->create();
    ['hire' => $hire] = auditFixture();
    $audit = createAudit($hire);

    $response = $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/cancel");

    $response->assertOk()->assertJsonPath('data.status', 'cancelled');
    expect($audit->fresh()->cancelled_at)->not->toBeNull();
});

it('forbids cancelling an audit that has already been submitted', function () {
    $admin = User::factory()->admin()->create();
    ['hire' => $hire] = auditFixture();
    $audit = createAudit($hire);
    $audit->update(['status' => 'submitted', 'submitted_at' => now()]);

    $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/cancel")->assertStatus(422);
});

it('forbids a company_owner from cancelling an audit', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    ['hire' => $hire] = auditFixture();
    $audit = createAudit($hire);

    $this->actingAs($owner)->postJson("/api/v1/audits/{$audit->id}/cancel")->assertForbidden();
});

// ─── View / list scoping ─────────────────────────────────────────────────────

it('lets a company_owner view their own company audits only', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $otherCompany = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $ownHire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
    ]);
    $otherHire = TpHire::factory()->active()->create([
        'company_id' => $otherCompany->id,
        'tp_partner_id' => $tpPartner->id,
    ]);
    createAudit($ownHire);
    createAudit($otherHire);

    $this->actingAs($owner)->getJson('/api/v1/audits')
        ->assertOk()->assertJsonCount(1, 'data');
});

it('lets a TP auditor list only audits for their firm engagements', function () {
    $myCompany = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();
    $otherFirm = TpPartner::factory()->create();
    $otherHire = TpHire::factory()->active()->create([
        'company_id' => $otherCompany->id,
        'tp_partner_id' => $otherFirm->id,
    ]);
    $myHire = TpHire::factory()->active()->create([
        'company_id' => $myCompany->id,
        'tp_partner_id' => $tpPartner->id,
    ]);
    createAudit($myHire);
    createAudit($otherHire);

    $this->actingAs($auditor)->getJson('/api/v1/audits')
        ->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.tp_hire_id', $myHire->id);
});

it('lets an admin list every company audit', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $hireA = TpHire::factory()->active()->create(['company_id' => $company->id, 'tp_partner_id' => $tpPartner->id]);
    $hireB = TpHire::factory()->active()->create(['company_id' => $company->id, 'tp_partner_id' => $tpPartner->id]);
    createAudit($hireA);
    createAudit($hireB);

    $this->actingAs($admin)->getJson('/api/v1/audits')->assertOk()->assertJsonCount(2, 'data');
});

it('lets the assigned firm view a single audit, but not a stranger', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();
    $stranger = User::factory()->withTpPartner(TpPartner::factory()->create())->create();
    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
    ]);
    $audit = createAudit($hire);

    $this->actingAs($auditor)->getJson("/api/v1/audits/{$audit->id}")->assertOk();
    $this->actingAs($stranger)->getJson("/api/v1/audits/{$audit->id}")->assertForbidden();
});
