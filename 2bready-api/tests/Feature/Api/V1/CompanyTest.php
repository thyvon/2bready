<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Industry\Models\Industry;
use App\Domain\User\Models\User;
use Database\Seeders\PlatformSettingSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(PlatformSettingSeeder::class);
    $this->industry = Industry::factory()->create(['code' => 'F&B']);
});

// ─── Create ──────────────────────────────────────────────────────────────────

it('lets an admin create a company', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/companies', [
        'name' => 'Sabay Bakery',
        'name_kh' => 'សាបាយ បេከើរី',
        'industry_id' => $this->industry->id,
        'employee_count' => 12,
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'name', 'name_kh', 'industry_id', 'industry_code', 'country_code', 'status']])
        ->assertJsonPath('data.name', 'Sabay Bakery')
        ->assertJsonPath('data.industry_id', $this->industry->id)
        ->assertJsonPath('data.industry_code', 'F&B')
        ->assertJsonPath('data.country_code', 'KH');

    expect(Company::where('name', 'Sabay Bakery')->exists())->toBeTrue();
});

it('rejects company creation without required fields', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/v1/companies', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'industry_id']);
});

it('rejects company creation with an unknown industry_id', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/v1/companies', ['name' => 'X', 'industry_id' => 'not-a-real-id'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['industry_id']);
});

it('requires authentication to create a company', function () {
    $this->postJson('/api/v1/companies', ['name' => 'X', 'industry_id' => $this->industry->id])
        ->assertUnauthorized();
});

it('forbids a company_owner from creating a company', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)
        ->postJson('/api/v1/companies', ['name' => 'X', 'industry_id' => $this->industry->id])
        ->assertForbidden();
});

// ─── Self-service registration ──────────────────────────────────────────────

it('lets a company_owner without a company register their own', function () {
    $owner = User::factory()->companyOwner()->create();

    $response = $this->actingAs($owner)->postJson('/api/v1/companies/register', [
        'name' => 'Owner Registered Co',
        'industry_id' => $this->industry->id,
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['company' => ['id', 'name'], 'user' => ['id', 'current_company_id']]])
        ->assertJsonPath('data.company.name', 'Owner Registered Co');

    $company = Company::where('name', 'Owner Registered Co')->firstOrFail();
    expect($owner->fresh()->current_company_id)->toBe($company->id);
});

it('lets a company_owner who already has a company register another (§0.7 — many companies per owner)', function () {
    $existing = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($existing)->create();

    $response = $this->actingAs($owner)
        ->postJson('/api/v1/companies/register', ['name' => 'Second Co', 'industry_id' => $this->industry->id]);

    $response->assertCreated()->assertJsonPath('data.company.name', 'Second Co');

    $second = Company::where('name', 'Second Co')->firstOrFail();
    expect($owner->fresh()->companies()->pluck('companies.id')->all())->toEqualCanonicalizing([$existing->id, $second->id]);
    expect($owner->fresh()->current_company_id)->toBe($second->id);
});

it('forbids a company_member from self-registering a company', function () {
    $company = Company::factory()->create();
    $member = User::factory()->withRole('company_member')->create();

    $this->actingAs($member)
        ->postJson('/api/v1/companies/register', ['name' => 'Member Co', 'industry_id' => $this->industry->id])
        ->assertForbidden();
});

it('forbids an admin from using the self-service registration endpoint', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/v1/companies/register', ['name' => 'Admin Co', 'industry_id' => $this->industry->id])
        ->assertForbidden();
});

it('requires authentication to self-register a company', function () {
    $this->postJson('/api/v1/companies/register', ['name' => 'X', 'industry_id' => $this->industry->id])
        ->assertUnauthorized();
});

it('ignores employee_count sent by a self-registering company_owner', function () {
    $owner = User::factory()->companyOwner()->create();

    // A company can't be trusted to self-report the figure its own compliance
    // bypass eligibility is evaluated against — only admin/staff/finance may set it.
    $response = $this->actingAs($owner)->postJson('/api/v1/companies/register', [
        'name' => 'Self Reported Co',
        'industry_id' => $this->industry->id,
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
        'industry_id' => $this->industry->id,
        'employee_count' => 3,
    ]);

    $response->assertCreated()->assertJsonPath('data.bypass_flags.company_internal_rules', true);
});

it('does not set the bypass flag when employee_count is at or above the platform threshold', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/companies', [
        'name' => 'Big Restaurant Group',
        'industry_id' => $this->industry->id,
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

it('lets an admin filter companies by industry_id', function () {
    $other = Industry::factory()->create(['code' => 'RETAIL']);
    Company::factory()->create(['industry_id' => $this->industry->id]);
    Company::factory()->create(['industry_id' => $other->id]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/v1/companies?industry_id='.$this->industry->id)
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('forbids a company_member from listing all companies', function () {
    $company = Company::factory()->create();
    $member = User::factory()->withRole('company_member')->withCompany($company)->create();

    $this->actingAs($member)->getJson('/api/v1/companies')->assertForbidden();
});

// ─── View ────────────────────────────────────────────────────────────────────

it('lets a company_owner view their own company', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->getJson("/api/v1/companies/{$company->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $company->id);
});

it('forbids a company_owner from viewing another company', function () {
    $ownCompany = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($ownCompany)->create();

    $this->actingAs($owner)->getJson("/api/v1/companies/{$otherCompany->id}")->assertForbidden();
});

// ─── Update ──────────────────────────────────────────────────────────────────

it('lets an admin change a company to a different industry', function () {
    $retail = Industry::factory()->create(['code' => 'RETAIL']);
    $company = Company::factory()->create(['industry_id' => $this->industry->id]);
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}", [
        'industry_id' => $retail->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.industry_id', $retail->id)
        ->assertJsonPath('data.industry_code', 'RETAIL');
});

it('rejects updating a company to an unknown industry_id', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/companies/{$company->id}", [
        'industry_id' => 'not-a-real-id',
    ])->assertUnprocessable()->assertJsonValidationErrors(['industry_id']);
});

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
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->patchJson("/api/v1/companies/{$company->id}", [
        'name_kh' => 'ឈ្មោះថ្មី',
        'status' => 'suspended',
    ])->assertOk()->assertJsonPath('data.name_kh', 'ឈ្មោះថ្មី');

    expect($company->fresh()->status->value)->toBe('active');
});

it('lets a company_owner set their own compliance_start_date', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $response = $this->actingAs($owner)->patchJson("/api/v1/companies/{$company->id}", [
        'compliance_start_date' => '2023-01-01',
    ])->assertOk();

    expect(\Carbon\Carbon::parse($response->json('data.compliance_start_date'))->toDateString())->toBe('2023-01-01');
    expect($company->fresh()->compliance_start_date->toDateString())->toBe('2023-01-01');
});

it('rejects a compliance_start_date in the future', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->patchJson("/api/v1/companies/{$company->id}", [
        'compliance_start_date' => now()->addYear()->toDateString(),
    ])->assertUnprocessable()->assertJsonValidationErrors(['compliance_start_date']);
});

it('forbids a company_owner from changing their own employee_count', function () {
    $company = Company::factory()->create(['employee_count' => 20]);
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

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
    $owner = User::factory()->companyOwner()->withCompany($ownCompany)->create();

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
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->deleteJson("/api/v1/companies/{$company->id}")->assertForbidden();
});

// ─── Suspension enforcement ─────────────────────────────────────────────────

it('forbids a company_owner whose current company is suspended from an ordinary business route', function () {
    $company = Company::factory()->suspended()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->getJson("/api/v1/companies/{$company->id}")->assertForbidden();
});

it('forbids switching into a suspended company', function () {
    $active = Company::factory()->create();
    $suspended = Company::factory()->suspended()->create();
    $owner = User::factory()->companyOwner()->withCompany($active)->create();
    $owner->companies()->attach($suspended->id);

    $this->actingAs($owner)->postJson("/api/v1/companies/{$suspended->id}/switch")->assertForbidden();

    expect($owner->fresh()->current_company_id)->toBe($active->id);
});

it('lets a user whose current company is suspended switch away to a different active company', function () {
    // Regression test: the switch endpoint sits behind the same company.active
    // middleware as every other business route, which reads the user's *current*
    // (still-suspended) company — without an explicit exemption, a locked-out
    // user could never reach this endpoint to escape the lockout.
    $suspended = Company::factory()->suspended()->create();
    $active = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($suspended)->create();
    $owner->companies()->attach($active->id);

    $this->actingAs($owner)->postJson("/api/v1/companies/{$active->id}/switch")
        ->assertOk()
        ->assertJsonPath('data.current_company_id', $active->id);

    expect($owner->fresh()->current_company_id)->toBe($active->id);
});

it('lets a company_owner keep using an active company normally', function () {
    $company = Company::factory()->create(['status' => 'active']);
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->getJson("/api/v1/companies/{$company->id}")->assertOk();
});

it('does not affect an admin even though some company somewhere is suspended', function () {
    Company::factory()->suspended()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/v1/companies')->assertOk();
});
