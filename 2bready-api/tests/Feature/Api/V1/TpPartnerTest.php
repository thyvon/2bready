<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Create ──────────────────────────────────────────────────────────────────

it('lets an admin register a TP firm', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/tp-partners', [
        'name' => 'Sabay Audit Co.',
        'price_l2_cents' => 19900,
    ]);

    $response->assertCreated()->assertJsonPath('data.name', 'Sabay Audit Co.')
        // Sprint 7 onboarding: new firms start pending_approval, not active.
        ->assertJsonPath('data.status', 'pending_approval');
    expect(TpPartner::where('name', 'Sabay Audit Co.')->exists())->toBeTrue();
});

// ─── Approval (Sprint 7 onboarding) ─────────────────────────────────────────

it('lets an admin approve a pending firm, making it browsable by companies', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();
    $partner = TpPartner::factory()->pendingApproval()->create();

    $this->actingAs($owner)->getJson('/api/v1/tp-partners')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->actingAs($admin)->postJson("/api/v1/tp-partners/{$partner->id}/approve")
        ->assertOk()
        ->assertJsonPath('data.status', 'active');

    expect($partner->fresh()->status->value)->toBe('active');

    // Now visible to the company-side marketplace browse.
    $this->actingAs($owner)->getJson('/api/v1/tp-partners')
        ->assertOk()
        ->assertJsonPath('data.0.id', $partner->id);
});

it('forbids a company_owner from approving a firm', function () {
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();
    $partner = TpPartner::factory()->pendingApproval()->create();

    $this->actingAs($owner)->postJson("/api/v1/tp-partners/{$partner->id}/approve")->assertForbidden();
});

it('forbids approving a firm that is not pending approval', function () {
    $admin = User::factory()->admin()->create();
    $partner = TpPartner::factory()->create(); // factory default: active

    $this->actingAs($admin)->postJson("/api/v1/tp-partners/{$partner->id}/approve")->assertForbidden();
});

it('requires authentication to approve a firm', function () {
    $partner = TpPartner::factory()->pendingApproval()->create();

    $this->postJson("/api/v1/tp-partners/{$partner->id}/approve")->assertUnauthorized();
});

it('rejects TP firm creation without a name', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/tp-partners', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('forbids an auditor from registering a TP firm', function () {
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $this->actingAs($auditor)->postJson('/api/v1/tp-partners', ['name' => 'X'])
        ->assertForbidden();
});

// ─── Update ──────────────────────────────────────────────────────────────────

it('lets an admin update a TP firm', function () {
    $tpPartner = TpPartner::factory()->create(['name' => 'Old Name']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/tp-partners/{$tpPartner->id}", ['name' => 'New Name'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name');
});

it('forbids an auditor from updating a TP firm', function () {
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $this->actingAs($auditor)->patchJson("/api/v1/tp-partners/{$tpPartner->id}", ['name' => 'New Name'])
        ->assertForbidden();
});

// ─── Delete ──────────────────────────────────────────────────────────────────

it('lets an admin soft-delete a TP firm', function () {
    $tpPartner = TpPartner::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->deleteJson("/api/v1/tp-partners/{$tpPartner->id}")->assertNoContent();

    $this->assertSoftDeleted('tp_partners', ['id' => $tpPartner->id]);
});

it('forbids an auditor from deleting a TP firm', function () {
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $this->actingAs($auditor)->deleteJson("/api/v1/tp-partners/{$tpPartner->id}")->assertForbidden();
});

it('requires authentication to delete a TP firm', function () {
    $tpPartner = TpPartner::factory()->create();

    $this->deleteJson("/api/v1/tp-partners/{$tpPartner->id}")->assertUnauthorized();
});

// ─── Browse (company_owner) ────────────────────────────────────────────────

it('lets a company_owner browse only active TP firms', function () {
    $active = TpPartner::factory()->create(['name' => 'Active Co.']);
    TpPartner::factory()->suspended()->create(['name' => 'Suspended Co.']);
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();

    $response = $this->actingAs($owner)->getJson('/api/v1/tp-partners')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    $response->assertJsonPath('data.0.name', 'Active Co.');
});

it('lets admin/staff/finance browse TP firms of every status', function () {
    TpPartner::factory()->create();
    TpPartner::factory()->suspended()->create();
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson('/api/v1/tp-partners')->assertOk();

    expect($response->json('data'))->toHaveCount(2);
});

it('forbids a company_owner with no company from browsing TP firms', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->getJson('/api/v1/tp-partners')->assertForbidden();
});

it('requires authentication to browse TP firms', function () {
    $this->getJson('/api/v1/tp-partners')->assertUnauthorized();
});

// ─── Firm self-service pricing (Sprint 7) ───────────────────────────────────

it('lets a firm\'s own auditor update their pricing', function () {
    $tpPartner = TpPartner::factory()->create(['price_l2_cents' => 19900, 'price_l3_cents' => 29900]);
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $this->actingAs($auditor)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/pricing", [
        'price_l2_cents' => 24900,
        'price_l4_cents' => 49900,
    ])
        ->assertOk()
        ->assertJsonPath('data.price_l2_cents', 24900)
        ->assertJsonPath('data.price_l3_cents', 29900)
        ->assertJsonPath('data.price_l4_cents', 49900);
});

it('lets an admin update a firm\'s pricing', function () {
    $tpPartner = TpPartner::factory()->create(['price_l2_cents' => 19900]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/pricing", [
        'price_l2_cents' => 99900,
    ])
        ->assertOk()
        ->assertJsonPath('data.price_l2_cents', 99900);
});

it('forbids an auditor from updating another firm\'s pricing', function () {
    $tpPartner = TpPartner::factory()->create();
    $otherFirm = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($otherFirm)->create();

    $this->actingAs($auditor)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/pricing", [
        'price_l2_cents' => 99900,
    ])->assertForbidden();
});

it('forbids a company_owner from updating a firm\'s pricing', function () {
    $tpPartner = TpPartner::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();

    $this->actingAs($owner)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/pricing", [
        'price_l2_cents' => 99900,
    ])->assertForbidden();
});

it('rejects non-integer pricing values', function () {
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $this->actingAs($auditor)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/pricing", [
        'price_l2_cents' => 199.5,
    ])->assertUnprocessable()->assertJsonValidationErrors(['price_l2_cents']);
});

it('rejects negative pricing values', function () {
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $this->actingAs($auditor)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/pricing", [
        'price_l2_cents' => -100,
    ])->assertUnprocessable()->assertJsonValidationErrors(['price_l2_cents']);
});

it('requires authentication to update a firm\'s pricing', function () {
    $tpPartner = TpPartner::factory()->create();

    $this->patchJson("/api/v1/tp-partners/{$tpPartner->id}/pricing", [
        'price_l2_cents' => 99900,
    ])->assertUnauthorized();
});

// ─── TP self firm record (tp/me) ────────────────────────────────────────────

it('lets an auditor fetch their own firm via tp/me', function () {
    $tpPartner = TpPartner::factory()->create(['name' => 'My Firm']);
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $this->actingAs($auditor)->getJson('/api/v1/tp/me')
        ->assertOk()
        ->assertJsonPath('data.id', $tpPartner->id)
        ->assertJsonPath('data.name', 'My Firm');
});

it('forbids tp/me for an account with no firm attached', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/v1/tp/me')->assertForbidden();
});

it('requires authentication to fetch tp/me', function () {
    $this->getJson('/api/v1/tp/me')->assertUnauthorized();
});

// ─── Firm self-service profile (Sprint 7) ───────────────────────────────────

it('lets a firm\'s own auditor update their profile', function () {
    $tpPartner = TpPartner::factory()->create(['name' => 'Old Name', 'name_kh' => null]);
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $this->actingAs($auditor)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/profile", [
        'name' => 'Admit Unit Audit Services (Rebranded)',
        'name_kh' => 'អាឌីមិត',
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Admit Unit Audit Services (Rebranded)')
        ->assertJsonPath('data.name_kh', 'អាឌីមិត');
});

it('lets an admin update a firm\'s profile', function () {
    $tpPartner = TpPartner::factory()->create(['name' => 'Old Name']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/profile", [
        'name' => 'New Name',
    ])->assertOk()->assertJsonPath('data.name', 'New Name');
});

it('forbids an auditor from updating another firm\'s profile', function () {
    $tpPartner = TpPartner::factory()->create(['name' => 'Target Firm']);
    $otherFirm = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($otherFirm)->create();

    $this->actingAs($auditor)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/profile", [
        'name' => 'Hijacked',
    ])->assertForbidden();
});

it('forbids a company_owner from updating a firm\'s profile', function () {
    $tpPartner = TpPartner::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();

    $this->actingAs($owner)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/profile", [
        'name' => 'Hijacked',
    ])->assertForbidden();
});

it('rejects an over-long firm name', function () {
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();

    $this->actingAs($auditor)->patchJson("/api/v1/tp-partners/{$tpPartner->id}/profile", [
        'name' => str_repeat('x', 256),
    ])->assertUnprocessable()->assertJsonValidationErrors(['name']);
});

it('requires authentication to update a firm\'s profile', function () {
    $tpPartner = TpPartner::factory()->create();

    $this->patchJson("/api/v1/tp-partners/{$tpPartner->id}/profile", [
        'name' => 'Anonymous',
    ])->assertUnauthorized();
});
