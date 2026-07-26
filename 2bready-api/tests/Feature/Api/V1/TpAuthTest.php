<?php

declare(strict_types=1);

use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

it('lets a TP auditor log in via tp-login', function () {
    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create(['password' => Hash::make('password')]);

    $this->postJson('/api/v1/auth/tp-login', [
        'email' => $auditor->email,
        'password' => 'password',
    ])->assertOk()
        ->assertJsonPath('data.user.can_access_tp_portal', true)
        ->assertJsonPath('data.user.can_access_admin_portal', false);
});

it('rejects a company_owner account at tp-login', function () {
    $owner = User::factory()->companyOwner()->create(['password' => Hash::make('password')]);

    $this->postJson('/api/v1/auth/tp-login', [
        'email' => $owner->email,
        'password' => 'password',
    ])->assertUnprocessable();
});

it('rejects an admin account at tp-login', function () {
    $admin = User::factory()->admin()->create(['password' => Hash::make('password')]);

    $this->postJson('/api/v1/auth/tp-login', [
        'email' => $admin->email,
        'password' => 'password',
    ])->assertUnprocessable();
});

it('rejects a suspended TP auditor account at tp-login', function () {
    $auditor = User::factory()->withTpPartner()->suspended()->create(['password' => Hash::make('password')]);

    $this->postJson('/api/v1/auth/tp-login', [
        'email' => $auditor->email,
        'password' => 'password',
    ])->assertForbidden();
});
