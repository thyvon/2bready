<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Shared\Mail\MailSettingTestMail;
use App\Domain\Shared\Services\MailSettingService;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

it('lets an admin configure mail settings without ever getting the password back', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->patchJson('/api/v1/settings/mail', [
        'host' => 'smtp.example.com',
        'port' => 587,
        'username' => 'no-reply@example.com',
        'password' => 'super-secret-value',
        'encryption' => 'tls',
        'from_address' => 'no-reply@example.com',
        'from_name' => '2bReady',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.host', 'smtp.example.com')
        ->assertJsonPath('data.port', 587)
        ->assertJsonPath('data.password_configured', true)
        ->assertJsonMissingPath('data.password');

    $service = app(MailSettingService::class);
    expect($service->password())->toBe('super-secret-value');
    expect($service->isConfigured())->toBeTrue();
});

it('keeps the existing password when it is omitted from an update', function () {
    $admin = User::factory()->admin()->create();
    $service = app(MailSettingService::class);
    $service->save('smtp.example.com', 587, 'user', 'original-secret', 'tls', 'from@example.com', '2bReady', $admin);

    $this->actingAs($admin)->patchJson('/api/v1/settings/mail', [
        'host' => 'smtp.example.com',
        'port' => 2525,
        'from_address' => 'from@example.com',
        'from_name' => '2bReady',
    ])->assertOk()->assertJsonPath('data.port', 2525);

    expect($service->password())->toBe('original-secret');
});

it('forbids a non-admin from reading or updating mail settings', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->getJson('/api/v1/settings/mail')->assertForbidden();
    $this->actingAs($owner)->patchJson('/api/v1/settings/mail', [
        'host' => 'smtp.example.com',
        'port' => 587,
        'from_address' => 'from@example.com',
        'from_name' => '2bReady',
    ])->assertForbidden();
});

it('sends a real test email to the requesting admin once mail is configured', function () {
    Mail::fake();

    $admin = User::factory()->admin()->create(['email' => 'admin@example.com']);
    app(MailSettingService::class)->save('smtp.example.com', 587, 'user', 'secret', 'tls', 'from@example.com', '2bReady', $admin);

    $this->actingAs($admin)->postJson('/api/v1/settings/mail/test')->assertOk();

    Mail::assertSent(MailSettingTestMail::class, function ($mail) {
        return $mail->hasTo('admin@example.com');
    });
});

it('rejects a test send before mail settings have been configured', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/settings/mail/test')->assertUnprocessable();
});
