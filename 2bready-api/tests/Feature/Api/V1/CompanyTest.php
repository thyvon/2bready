<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use Database\Seeders\PlatformSettingSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(PlatformSettingSeeder::class);
});

// ─── Create ──────────────────────────────────────────────────────────────────

it('lets an admin create a company', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/companies', [
        'name' => 'Sabay Bakery',
        'name_kh' => 'សាបាយ បេከើរី',
        'industry_code' => 'F&B',
        'employee_count' => 12,
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'name', 'name_kh', 'industry_code', 'country_code', 'status']])
        ->assertJsonPath('data.name', 'Sabay Bakery')
        ->assertJsonPath('data.country_code', 'KH');

    expect(Company::where('name', 'Sabay Bakery')->exists())->toBeTrue();
});

it('rejects company creation without required fields', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/v1/companies', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'industry_code']);
});

it('requires authentication to create a company', function () {
    $this->postJson('/api/v1/companies', ['name' => 'X', 'industry_code' => 'F&B'])
        ->assertUnauthorized();
});

it('forbids a company_owner from creating a company', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->create(['company_id' => $company->id]);

    $this->actingAs($owner)
        ->postJson('/api/v1/companies', ['name' => 'X', 'industry_code' => 'F&B'])
        ->assertForbidden();
});

// ─── Self-service registration ──────────────────────────────────────────────

it('lets a company_owner without a company register their own', function () {
    $owner = User::factory()->companyOwner()->create(['company_id' => null]);

    $response = $this->actingAs($owner)->postJson('/api/v1/companies/register', [
        'name' => 'Owner Registered Co',
        'industry_code' => 'F&B',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['company' => ['id', 'name'], 'user' => ['id', 'company_id']]])
        ->assertJsonPath('data.company.name', 'Owner Registered Co');

    $company = Company::where('name', 'Owner Registered Co')->firstOrFail();
    expect($owner->fresh()->company_id)->toBe($company->id);
});

it('forbids a company_owner who already has a company from registering another', function () {
    $existing = Company::factory()->create();
    $owner = User::factory()->companyOwner()->create(['company_id' => $existing->id]);

    $this->actingAs($owner)
        ->postJson('/api/v1/companies/register', ['name' => 'Second Co', 'industry_code' => 'F&B'])
        ->assertForbidden();

    expect(Company::where('name', 'Second Co')->exists())->toBeFalse();
});

it('forbids a company_member from self-registering a company', function () {
    $company = Company::factory()->create();
    $member = User::factory()->withRole('company_member')->create(['company_id' => null]);

    $this->actingAs($member)
        ->postJson('/api/v1/companies/register', ['name' => 'Member Co', 'industry_code' => 'F&B'])
        ->assertForbidden();
});

it('forbids an admin from using the self-service registration endpoint', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/v1/companies/register', ['name' => 'Admin Co', 'industry_code' => 'F&B'])
        ->assertForbidden();
});

it('requires authentication to self-register a company', function () {
    $this->postJson('/api/v1/companies/register', ['name' => 'X', 'industry_code' => 'F&B'])
        ->assertUnauthorized();
});

it('ignores employee_count sent by a self-registering company_owner', function () {
    $owner = User::factory()->companyOwner()->create(['company_id' => null]);

    // A company can't be trusted to self-report the figure its own compliance
    // bypass eligibility is evaluated against — only admin/staff/finance may set it.
    $response = $this->actingAs($owner)->postJson('/api/v1/companies/register', [
        'name' => 'Self Reported Co',
        'industry_code' => 'F&B',
        'employee_count' => 1,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.company.employee_count', null)
        ->assertJsonPath('data.company.bypass_flags.company_internal_rules', false);
});

// ─── Auto-bypass rule (v3 §0.2/§0.5) ────────────────────────────────────────

it('sets the company_internal_rules bypass flag when employee_count is below the platform threshold', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/companies', [
        'name' => 'Tiny Cafe',
        'industry_code' => 'F&B',
        'employee_count' => 3,
    ]);

    $response->assertCreated()->assertJsonPath('data.bypass_flags.company_internal_rules', true);
});

it('does not set the bypass flag when employee_count is at or above the platform threshold', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/companies', [
        'name' => 'Big Restaurant Group',
        'industry_code' => 'F&B',
        'employee_count' => 50,
    ]);

    $response->assertCreated()->assertJsonPath('data.bypass_flags.company_internal_rules', false);
});

// ─── List ────────────────────────────────────────────────────────────────────

it('lets an admin list companies', function () {
    Company::factory()->count(3)->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/v1/companies')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure(['data', 'meta' => ['pagination']]);
});

it('forbids a company_member from listing all companies', function () {
    $company = Company::factory()->create();
    $member = User::factory()->withRole('company_member')->create(['company_id' => $company->id]);

    $this->actingAs($member)->getJson('/api/v1/companies')->assertForbidden();
});

// ─── View ────────────────────────────────────────────────────────────────────

it('lets a company_owner view their own company', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->create(['company_id' => $company->id]);

    $this->actingAs($owner)->getJson("/api/v1/companies/{$company->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $company->id);
});

it('forbids a company_owner from viewing another company', function () {
    $ownCompany = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $owner = User::factory()->companyOwner()->create(['company_id' => $ownCompany->id]);

    $this->actingAs($owner)->getJson("/api/v1/companies/{$otherCompany->id}")->assertForbidden();
});

// ─── Update ──────────────────────────────────────────────────────────────────

it('lets an admin update any company including status', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}", [
        'status' => 'suspended',
    ])->assertOk()->assertJsonPath('data.status', 'suspended');

    expect($company->fresh()->status->value)->toBe('suspended');
});

it('lets a company_owner update their own profile fields but not status', function () {
    $company = Company::factory()->create(['status' => 'active']);
    $owner = User::factory()->companyOwner()->create(['company_id' => $company->id]);

    $this->actingAs($owner)->patchJson("/api/v1/companies/{$company->id}", [
        'name_kh' => 'ឈ្មោះថ្មី',
        'status' => 'suspended',
    ])->assertOk()->assertJsonPath('data.name_kh', 'ឈ្មោះថ្មី');

    expect($company->fresh()->status->value)->toBe('active');
});

it('forbids a company_owner from changing their own employee_count', function () {
    $company = Company::factory()->create(['employee_count' => 20]);
    $owner = User::factory()->companyOwner()->create(['company_id' => $company->id]);

    $this->actingAs($owner)->patchJson("/api/v1/companies/{$company->id}", [
        'employee_count' => 2,
    ])->assertOk()->assertJsonPath('data.employee_count', 20);

    expect($company->fresh()->employee_count)->toBe(20);
});

it('lets an admin change a company employee_count', function () {
    $company = Company::factory()->create(['employee_count' => 20]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}", [
        'employee_count' => 2,
    ])->assertOk()->assertJsonPath('data.employee_count', 2);
});

it('forbids a company_owner from updating another company', function () {
    $ownCompany = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $owner = User::factory()->companyOwner()->create(['company_id' => $ownCompany->id]);

    $this->actingAs($owner)
        ->patchJson("/api/v1/companies/{$otherCompany->id}", ['name' => 'Hijack'])
        ->assertForbidden();
});

// ─── Delete ──────────────────────────────────────────────────────────────────

it('lets an admin soft-delete a company', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->deleteJson("/api/v1/companies/{$company->id}")->assertNoContent();

    $this->assertSoftDeleted('companies', ['id' => $company->id]);
});

it('forbids a company_owner from deleting a company', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->create(['company_id' => $company->id]);

    $this->actingAs($owner)->deleteJson("/api/v1/companies/{$company->id}")->assertForbidden();
});
