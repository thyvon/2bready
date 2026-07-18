<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── List ────────────────────────────────────────────────────────────────────

it('lets an admin list internal users only, never company_owner/company_member', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->withRole('staff')->create();
    $company = Company::factory()->create();
    User::factory()->companyOwner()->withCompany($company)->create();

    $response = $this->actingAs($admin)->getJson('/api/v1/users');

    $response->assertOk();
    // admin (self) + staff = 2 — the company_owner must never appear here.
    expect($response->json('meta.pagination.total'))->toBe(2);
    $roles = collect($response->json('data'))->pluck('roles')->flatten();
    expect($roles->contains('company_owner'))->toBeFalse();
});

it('filters the user list by role and search', function () {
    $admin = User::factory()->admin()->create(['name' => 'Root Admin']);
    User::factory()->withRole('finance')->create(['name' => 'Finance Person', 'email' => 'finance@example.com']);

    $response = $this->actingAs($admin)->getJson('/api/v1/users?role=finance');
    $response->assertOk();
    expect($response->json('meta.pagination.total'))->toBe(1);
    expect($response->json('data.0.email'))->toBe('finance@example.com');

    $response = $this->actingAs($admin)->getJson('/api/v1/users?search=Root');
    $response->assertOk();
    expect($response->json('meta.pagination.total'))->toBe(1);
});

it('forbids a company_owner from listing users', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->getJson('/api/v1/users')->assertForbidden();
});

it('requires authentication to list users', function () {
    $this->getJson('/api/v1/users')->assertUnauthorized();
});

// ─── Show ────────────────────────────────────────────────────────────────────

it('lets an admin view a single internal user', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->withRole('staff')->create();

    $this->actingAs($admin)->getJson("/api/v1/users/{$staff->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $staff->id);
});

it('returns 404 for a company_owner id via the internal user show endpoint', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($admin)->getJson("/api/v1/users/{$owner->id}")->assertNotFound();
});

// ─── Create ──────────────────────────────────────────────────────────────────

it('lets an admin create a new internal staff user', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/users', [
        'name' => 'New Staffer',
        'email' => 'newstaff@example.com',
        'password' => 'Secret1234',
        'password_confirmation' => 'Secret1234',
        'roles' => ['staff'],
    ]);

    $response->assertCreated()->assertJsonPath('data.email', 'newstaff@example.com');

    $created = User::where('email', 'newstaff@example.com')->first();
    expect($created)->not->toBeNull();
    expect($created->hasRole('staff'))->toBeTrue();
    expect($created->status->value)->toBe('active');
    expect($created->email_verified_at)->not->toBeNull();
});

it('rejects creating a user with a company-side role', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/users', [
        'name' => 'Sneaky',
        'email' => 'sneaky@example.com',
        'password' => 'Secret1234',
        'password_confirmation' => 'Secret1234',
        'roles' => ['company_owner'],
    ])->assertUnprocessable()->assertJsonValidationErrors('roles.0');
});

it('forbids a company_owner from creating a user', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->postJson('/api/v1/users', [
        'name' => 'X', 'email' => 'x@example.com', 'password' => 'Secret1234', 'password_confirmation' => 'Secret1234', 'roles' => ['staff'],
    ])->assertForbidden();
});

// ─── Update ──────────────────────────────────────────────────────────────────

it('lets an admin update another user\'s name, status, and roles', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->withRole('staff')->create();

    $response = $this->actingAs($admin)->patchJson("/api/v1/users/{$staff->id}", [
        'name' => 'Renamed',
        'status' => 'suspended',
        'roles' => ['finance'],
    ]);

    $response->assertOk()->assertJsonPath('data.name', 'Renamed');

    $staff->refresh();
    expect($staff->status->value)->toBe('suspended');
    expect($staff->hasRole('finance'))->toBeTrue();
    expect($staff->hasRole('staff'))->toBeFalse();
});

it('blocks an admin from suspending their own account', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/users/{$admin->id}", ['status' => 'suspended'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('status');

    expect($admin->fresh()->status->value)->toBe('active');
});

it('lets an admin change their own name (self-update is not fully blocked, only status)', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/users/{$admin->id}", ['name' => 'New Name'])
        ->assertOk();

    expect($admin->fresh()->name)->toBe('New Name');
});

it('returns 404 updating a company_owner via the internal user endpoint', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($admin)->patchJson("/api/v1/users/{$owner->id}", ['name' => 'X'])->assertNotFound();
});

// ─── Roles (read-only) ───────────────────────────────────────────────────────

it('lets an admin list all roles with their permissions', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson('/api/v1/roles');

    $response->assertOk();
    $names = collect($response->json('data'))->pluck('name');
    expect($names)->toContain('admin', 'staff', 'finance', 'auditor', 'company_owner', 'company_member');
});

it('forbids a company_owner from listing roles', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->getJson('/api/v1/roles')->assertForbidden();
});
