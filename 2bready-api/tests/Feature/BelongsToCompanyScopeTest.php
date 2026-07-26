<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Payment\Models\Subscription;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// Regression test for a real bug found while scoping TP/auditor access: an
// authenticated, non-bypass user with a null current_company_id (the first
// account type to be permanently in that state — company_owner/member always
// have one, admin/staff/finance are explicitly bypassed by role) must see
// zero BelongsToCompany-scoped rows, not every company's rows.
it('returns no rows for an authenticated non-bypass user with no current company', function () {
    Subscription::factory()->count(3)->create();

    $auditor = User::factory()->withRole('auditor')->create();
    expect($auditor->current_company_id)->toBeNull();

    $this->actingAs($auditor);

    expect(Subscription::query()->count())->toBe(0);
});

it('still scopes a company_owner to only their own company', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    Subscription::factory()->create(['company_id' => $company->id]);
    Subscription::factory()->create(['company_id' => $otherCompany->id]);

    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $this->actingAs($owner);

    $results = Subscription::query()->get();

    expect($results)->toHaveCount(1);
    expect($results->first()->company_id)->toBe($company->id);
});

it('still bypasses the scope entirely for admin/staff/finance', function () {
    Subscription::factory()->count(3)->create();

    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);

    expect(Subscription::query()->count())->toBe(3);
});

it('leaves the query unscoped when there is no authenticated user at all', function () {
    Subscription::factory()->count(2)->create();

    expect(Subscription::query()->count())->toBe(2);
});
