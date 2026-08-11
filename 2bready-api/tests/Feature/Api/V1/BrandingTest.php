<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Shared\Models\PlatformSetting;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    Storage::fake('local');
});

function uploadLogoPayload(): array
{
    return ['logo' => UploadedFile::fake()->image('logo.png', 120, 120)];
}

it('lets an admin upload the platform logo', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/settings/logo', uploadLogoPayload());

    $response->assertOk()->assertJsonPath('data.url', fn ($url) => is_string($url) && $url !== '');

    $setting = PlatformSetting::query()->where('key', 'branding.logo')->first();
    expect($setting)->not->toBeNull();
    expect($setting->value['path'])->toBe('branding/logo.png');

    Storage::disk('local')->assertExists('branding/logo.png');
});

it('replaces the previous logo on re-upload and removes the old file', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', uploadLogoPayload())->assertOk();
    Storage::disk('local')->assertExists('branding/logo.png');

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        'logo' => UploadedFile::fake()->image('logo.svg', 120, 120)->mimeType('image/svg+xml'),
    ])->assertOk();

    $setting = PlatformSetting::query()->where('key', 'branding.logo')->first();
    expect($setting->value['path'])->toBe('branding/logo.svg');
    Storage::disk('local')->assertMissing('branding/logo.png');
    Storage::disk('local')->assertExists('branding/logo.svg');
});

it('rejects a logo upload without an image file', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['logo']);
});

it('rejects a non-image logo upload', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        'logo' => UploadedFile::fake()->create('logo.exe', 10),
    ])->assertUnprocessable()->assertJsonValidationErrors(['logo']);
});

it('rejects an oversized logo upload', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        'logo' => UploadedFile::fake()->image('logo.png')->size(3000),
    ])->assertUnprocessable()->assertJsonValidationErrors(['logo']);
});

it('forbids non-admin roles from uploading the platform logo', function () {
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();

    $this->actingAs($owner)->postJson('/api/v1/settings/logo', uploadLogoPayload())->assertForbidden();
});

it('requires authentication to upload the platform logo', function () {
    $this->postJson('/api/v1/settings/logo', uploadLogoPayload())->assertUnauthorized();
});

it('lets anyone fetch the logo URL publicly, returning null when unset', function () {
    $this->getJson('/api/v1/branding/logo')
        ->assertOk()
        ->assertJsonPath('data.url', null);

    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->postJson('/api/v1/settings/logo', uploadLogoPayload())->assertOk();

    // No auth header at all — the URL must be reachable by marketing/etc.
    $this->getJson('/api/v1/branding/logo')
        ->assertOk()
        ->assertJsonPath('data.url', fn ($url) => is_string($url) && str_starts_with($url, 'http'));
});

it('returns all four branding slots publicly, null when unset', function () {
    $this->getJson('/api/v1/branding')
        ->assertOk()
        ->assertJsonPath('data.light', null)
        ->assertJsonPath('data.dark', null)
        ->assertJsonPath('data.footer', null)
        ->assertJsonPath('data.footerDark', null);

    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->postJson('/api/v1/settings/logo', uploadLogoPayload())->assertOk();

    $this->getJson('/api/v1/branding')
        ->assertOk()
        ->assertJsonPath('data.light', fn ($url) => is_string($url) && str_starts_with($url, 'http'))
        ->assertJsonPath('data.dark', null)
        ->assertJsonPath('data.footer', null)
        ->assertJsonPath('data.footerDark', null);
});

it('uploads each branding slot separately', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', uploadLogoPayload())->assertOk();
    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        ...uploadLogoPayload(),
        'slot' => 'dark',
    ])->assertOk();
    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        'logo' => UploadedFile::fake()->image('footer.png', 200, 40),
        'slot' => 'footer',
    ])->assertOk();
    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        'logo' => UploadedFile::fake()->image('footer-dark.png', 200, 40),
        'slot' => 'footer_dark',
    ])->assertOk();

    expect(PlatformSetting::query()->where('key', 'branding.logo')->value('value')['path'])->toBe('branding/logo.png');
    expect(PlatformSetting::query()->where('key', 'branding.logo_dark')->value('value')['path'])->toBe('branding/logo-dark.png');
    expect(PlatformSetting::query()->where('key', 'branding.logo_footer')->value('value')['path'])->toBe('branding/logo-footer.png');
    expect(PlatformSetting::query()->where('key', 'branding.logo_footer_dark')->value('value')['path'])->toBe('branding/logo-footer-dark.png');

    Storage::disk('local')->assertExists('branding/logo.png');
    Storage::disk('local')->assertExists('branding/logo-dark.png');
    Storage::disk('local')->assertExists('branding/logo-footer.png');
    Storage::disk('local')->assertExists('branding/logo-footer-dark.png');

    $this->getJson('/api/v1/branding')
        ->assertJsonPath('data.light', fn ($url) => is_string($url))
        ->assertJsonPath('data.dark', fn ($url) => is_string($url))
        ->assertJsonPath('data.footer', fn ($url) => is_string($url))
        ->assertJsonPath('data.footerDark', fn ($url) => is_string($url));
});

it('replaces the previous logo within the same slot only', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        'logo' => UploadedFile::fake()->image('footer.png', 200, 40),
        'slot' => 'footer',
    ])->assertOk();
    Storage::disk('local')->assertExists('branding/logo-footer.png');

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        'logo' => UploadedFile::fake()->image('footer.svg', 200, 40)->mimeType('image/svg+xml'),
        'slot' => 'footer',
    ])->assertOk();

    expect(PlatformSetting::query()->where('key', 'branding.logo_footer')->value('value')['path'])->toBe('branding/logo-footer.svg');
    Storage::disk('local')->assertMissing('branding/logo-footer.png');
    Storage::disk('local')->assertExists('branding/logo-footer.svg');
    Storage::disk('local')->assertMissing('branding/logo.png');
});

it('rejects an invalid branding slot', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        ...uploadLogoPayload(),
        'slot' => 'banner',
    ])->assertUnprocessable()->assertJsonValidationErrors(['slot']);

    $this->actingAs($admin)->deleteJson('/api/v1/settings/logo', ['slot' => 'banner'])
        ->assertUnprocessable()->assertJsonValidationErrors(['slot']);
});

it('removes a logo from a specific slot only', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/settings/logo', uploadLogoPayload())->assertOk();
    $this->actingAs($admin)->postJson('/api/v1/settings/logo', [
        'logo' => UploadedFile::fake()->image('footer.png', 200, 40),
        'slot' => 'footer',
    ])->assertOk();

    $this->actingAs($admin)->deleteJson('/api/v1/settings/logo', ['slot' => 'footer'])->assertNoContent();

    expect(PlatformSetting::query()->where('key', 'branding.logo_footer')->exists())->toBeFalse();
    expect(PlatformSetting::query()->where('key', 'branding.logo')->exists())->toBeTrue();
    Storage::disk('local')->assertMissing('branding/logo-footer.png');
    Storage::disk('local')->assertExists('branding/logo.png');
});

it('lets an admin remove the platform logo', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->postJson('/api/v1/settings/logo', uploadLogoPayload())->assertOk();

    $this->actingAs($admin)->deleteJson('/api/v1/settings/logo')->assertNoContent();

    expect(PlatformSetting::query()->where('key', 'branding.logo')->exists())->toBeFalse();
    Storage::disk('local')->assertMissing('branding/logo.png');

    $this->getJson('/api/v1/branding/logo')->assertJsonPath('data.url', null);
});

it('forbids non-admin roles from removing the platform logo', function () {
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();

    $this->actingAs($owner)->deleteJson('/api/v1/settings/logo')->assertForbidden();
});

it('requires authentication to remove the platform logo', function () {
    $this->deleteJson('/api/v1/settings/logo')->assertUnauthorized();
});
