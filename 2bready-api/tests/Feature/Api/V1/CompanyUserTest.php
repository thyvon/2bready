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

it('lets an admin list a company\'s users', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $member = User::factory()->withRole('company_member')->withCompany($company)->create();

    $otherCompany = Company::factory()->create();
    User::factory()->companyOwner()->withCompany($otherCompany)->create();

    $response = $this->actingAs($admin)->getJson("/api/v1/companies/{$company->id}/users");

    $response->assertOk();
    $ids = collect($response->json('data'))->pluck('id');
    expect($ids)->toHaveCount(2);
    expect($ids)->toContain($owner->id, $member->id);
});

it('forbids listing users for a company neither internal nor a member of', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($companyA)->create();

    $this->actingAs($owner)->getJson("/api/v1/companies/{$companyB->id}/users")->assertForbidden();
});

// ─── Update: status ──────────────────────────────────────────────────────────

it('lets an admin suspend a company member', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $member = User::factory()->withRole('company_member')->withCompany($company)->create();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}/users/{$member->id}", [
        'status' => 'suspended',
    ])->assertOk()->assertJsonPath('data.status', 'suspended');

    expect($member->fresh()->status->value)->toBe('suspended');
});

it('forbids finance from updating a company user despite being able to view the company', function () {
    $finance = User::factory()->withRole('finance')->create();
    $company = Company::factory()->create();
    $member = User::factory()->withRole('company_member')->withCompany($company)->create();

    $this->actingAs($finance)->getJson("/api/v1/companies/{$company->id}/users")->assertOk();
    $this->actingAs($finance)->patchJson("/api/v1/companies/{$company->id}/users/{$member->id}", [
        'status' => 'suspended',
    ])->assertForbidden();
});

// ─── Update: role ────────────────────────────────────────────────────────────

it('lets an admin promote a company member to owner', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    User::factory()->companyOwner()->withCompany($company)->create();
    $member = User::factory()->withRole('company_member')->withCompany($company)->create();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}/users/{$member->id}", [
        'role' => 'company_owner',
    ])->assertOk();

    expect($member->fresh()->hasRole('company_owner'))->toBeTrue();
});

it('blocks demoting a company\'s only owner to member', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}/users/{$owner->id}", [
        'role' => 'company_member',
    ])->assertUnprocessable()->assertJsonValidationErrors('role');

    expect($owner->fresh()->hasRole('company_owner'))->toBeTrue();
});

it('allows demoting an owner when another owner remains', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $ownerA = User::factory()->companyOwner()->withCompany($company)->create();
    $ownerB = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}/users/{$ownerA->id}", [
        'role' => 'company_member',
    ])->assertOk();

    expect($ownerA->fresh()->hasRole('company_owner'))->toBeFalse();
    expect($ownerB->fresh()->hasRole('company_owner'))->toBeTrue();
});

// ─── Safety ──────────────────────────────────────────────────────────────────

it('returns 404 when the target user does not belong to the given company', function () {
    $admin = User::factory()->admin()->create();
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();
    $memberOfB = User::factory()->withRole('company_member')->withCompany($companyB)->create();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$companyA->id}/users/{$memberOfB->id}", [
        'status' => 'suspended',
    ])->assertNotFound();
});

it('requires authentication to list company users', function () {
    $company = Company::factory()->create();

    $this->getJson("/api/v1/companies/{$company->id}/users")->assertUnauthorized();
});

// ─── Google auth / 2FA toggles ──────────────────────────────────────────────

it('lets an admin force 2FA on for a company_owner, who never requires it by default', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    expect($owner->requiresTwoFactor())->toBeFalse();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}/users/{$owner->id}", [
        'two_factor_required' => true,
    ])->assertOk();

    expect($owner->fresh()->requiresTwoFactor())->toBeTrue();
});

it('lets an admin enable Google sign-in for a company member', function () {
    $admin = User::factory()->admin()->create();
    $company = Company::factory()->create();
    $member = User::factory()->withRole('company_member')->withCompany($company)->create();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}/users/{$member->id}", [
        'google_auth_enabled' => true,
    ])->assertOk()->assertJsonPath('data.google_auth_enabled', true);

    expect($member->fresh()->google_auth_enabled)->toBeTrue();
});
