<?php

declare(strict_types=1);

use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// Generic across account types — proving it's not company_owner-specific.
it('lets a company_owner update their own name and email', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->putJson('/api/v1/me', [
        'name' => 'New Name',
        'email' => $owner->email,
    ])->assertOk()->assertJsonPath('data.name', 'New Name');

    expect($owner->fresh()->name)->toBe('New Name');
});

it('lets a TP auditor update their own profile', function () {
    $auditor = User::factory()->withTpPartner()->create();

    $this->actingAs($auditor)->putJson('/api/v1/me', [
        'name' => 'Updated Auditor',
        'email' => $auditor->email,
    ])->assertOk()->assertJsonPath('data.name', 'Updated Auditor');
});

it('resets email verification when the email actually changes', function () {
    $owner = User::factory()->companyOwner()->create(['email_verified_at' => now()]);

    $this->actingAs($owner)->putJson('/api/v1/me', [
        'name' => $owner->name,
        'email' => 'brand-new@example.com',
    ])->assertOk();

    expect($owner->fresh()->email_verified_at)->toBeNull();
});

it('rejects a duplicate email on profile update', function () {
    $existing = User::factory()->companyOwner()->create();
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->putJson('/api/v1/me', [
        'name' => $owner->name,
        'email' => $existing->email,
    ])->assertUnprocessable();
});

it('requires authentication to update the profile', function () {
    $this->putJson('/api/v1/me', ['name' => 'X', 'email' => 'x@example.com'])->assertUnauthorized();
});

// ─── Change password ────────────────────────────────────────────────────────

it('lets a company_owner change their own password', function () {
    $owner = User::factory()->companyOwner()->create(['password' => Hash::make('old-password1')]);

    $this->actingAs($owner)->putJson('/api/v1/me/password', [
        'current_password' => 'old-password1',
        'password' => 'NewPassword2',
        'password_confirmation' => 'NewPassword2',
    ])->assertOk();

    expect(Hash::check('NewPassword2', $owner->fresh()->password))->toBeTrue();
});

it('revokes other tokens when the password is changed', function () {
    $owner = User::factory()->companyOwner()->create(['password' => Hash::make('old-password1')]);
    $owner->createToken('other-session');
    expect($owner->tokens()->count())->toBe(1);

    $this->actingAs($owner)->putJson('/api/v1/me/password', [
        'current_password' => 'old-password1',
        'password' => 'NewPassword2',
        'password_confirmation' => 'NewPassword2',
    ])->assertOk();

    expect($owner->tokens()->count())->toBe(0);
});

it('rejects a password change with the wrong current password', function () {
    $owner = User::factory()->companyOwner()->create(['password' => Hash::make('old-password1')]);

    $this->actingAs($owner)->putJson('/api/v1/me/password', [
        'current_password' => 'wrong-password',
        'password' => 'NewPassword2',
        'password_confirmation' => 'NewPassword2',
    ])->assertUnprocessable();

    expect(Hash::check('old-password1', $owner->fresh()->password))->toBeTrue();
});

it('lets a TP auditor change their own password too', function () {
    $auditor = User::factory()->withTpPartner()->create(['password' => Hash::make('old-password1')]);

    $this->actingAs($auditor)->putJson('/api/v1/me/password', [
        'current_password' => 'old-password1',
        'password' => 'NewPassword2',
        'password_confirmation' => 'NewPassword2',
    ])->assertOk();

    expect(Hash::check('NewPassword2', $auditor->fresh()->password))->toBeTrue();
});

it('requires authentication to change the password', function () {
    $this->putJson('/api/v1/me/password', [
        'current_password' => 'x',
        'password' => 'NewPassword2',
        'password_confirmation' => 'NewPassword2',
    ])->assertUnauthorized();
});
