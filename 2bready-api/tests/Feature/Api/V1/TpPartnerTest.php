<?php

declare(strict_types=1);

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

    $response->assertCreated()->assertJsonPath('data.name', 'Sabay Audit Co.');
    expect(TpPartner::where('name', 'Sabay Audit Co.')->exists())->toBeTrue();
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
