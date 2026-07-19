<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Shared\Services\GoogleOAuthSettingService;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

it('lets an admin configure Google OAuth without ever getting the secret back', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->patchJson('/api/v1/settings/google-oauth', [
        'enabled' => true,
        'client_id' => 'client-123.apps.googleusercontent.com',
        'client_secret' => 'super-secret-value',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.enabled', true)
        ->assertJsonPath('data.client_id', 'client-123.apps.googleusercontent.com')
        ->assertJsonPath('data.client_secret_configured', true)
        ->assertJsonMissingPath('data.client_secret');

    $service = app(GoogleOAuthSettingService::class);
    expect($service->clientSecret())->toBe('super-secret-value');
    expect($service->isFullyConfigured())->toBeTrue();
});

it('keeps the existing secret when client_secret is omitted from an update', function () {
    $admin = User::factory()->admin()->create();
    $service = app(GoogleOAuthSettingService::class);
    $service->save(true, 'client-123', 'original-secret', $admin);

    $this->actingAs($admin)->patchJson('/api/v1/settings/google-oauth', [
        'enabled' => false,
        'client_id' => 'client-123',
    ])->assertOk()->assertJsonPath('data.enabled', false);

    expect($service->clientSecret())->toBe('original-secret');
});

it('forbids a non-admin from reading or updating Google OAuth settings', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->getJson('/api/v1/settings/google-oauth')->assertForbidden();
    $this->actingAs($owner)->patchJson('/api/v1/settings/google-oauth', [
        'enabled' => true,
        'client_id' => 'x',
    ])->assertForbidden();
});

it('reports google auth status as disabled until fully configured', function () {
    expect(app(GoogleOAuthSettingService::class)->isFullyConfigured())->toBeFalse();

    $this->getJson('/api/v1/auth/google/status')->assertOk()->assertJsonPath('data.enabled', false);

    app(GoogleOAuthSettingService::class)->save(true, 'client-123', 'secret', User::factory()->admin()->create());

    $this->getJson('/api/v1/auth/google/status')->assertOk()->assertJsonPath('data.enabled', true);
});
