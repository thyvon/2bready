<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\User\Models\User;
use Database\Seeders\PlatformSettingSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(PlatformSettingSeeder::class);
});

it('lets an admin list platform settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/v1/settings')
        ->assertOk()
        ->assertJsonFragment(['key' => 'bypass_employee_threshold', 'value' => 8]);
});

it('lets an admin update a platform setting', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patchJson('/api/v1/settings/bypass_employee_threshold', ['value' => 15, 'group' => 'compliance'])
        ->assertOk()
        ->assertJsonPath('data.value', 15);

    expect(app(PlatformSettingService::class)->get('bypass_employee_threshold'))->toBe(15);
});

it('forbids a non-admin from viewing platform settings', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->create(['company_id' => $company->id]);

    $this->actingAs($owner)->getJson('/api/v1/settings')->assertForbidden();
});

it('requires authentication to view platform settings', function () {
    $this->getJson('/api/v1/settings')->assertUnauthorized();
});
