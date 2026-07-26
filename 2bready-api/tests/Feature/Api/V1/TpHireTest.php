<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

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

    $template = DocumentTemplate::factory()->create();
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
        'status' => 'review',
    ]);

    $this->actingAs($auditor)->getJson("/api/v1/tp/companies/{$company->id}/documents")
        ->assertOk()->assertJsonCount(1, 'data');

    $this->actingAs($auditor)->postJson("/api/v1/documents/{$document->id}/verify")
        ->assertOk()->assertJsonPath('data.status', 'verified');
});

it('forbids a TP from seeing or reviewing a company they have no active hire for', function () {
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();
    $otherCompany = Company::factory()->create();

    $this->actingAs($auditor)->getJson("/api/v1/tp/companies/{$otherCompany->id}/documents")->assertForbidden();

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
    ]);

    $template = DocumentTemplate::factory()->create();
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
