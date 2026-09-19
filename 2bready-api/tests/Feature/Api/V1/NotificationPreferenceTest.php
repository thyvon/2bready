<?php

declare(strict_types=1);

use App\Domain\Notification\Enums\NotificationType;
use App\Domain\Notification\Models\NotificationPreference;
use App\Domain\Notification\Services\NotificationPreferenceService;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Index (list preferences) ────────────────────────────────────────────────

it('returns all notification types with defaults for a new user', function () {
    $user = User::factory()->withRole('company_member')->create();

    $response = $this->actingAs($user)->getJson('/api/v1/notification-preferences');

    $response->assertOk()
        ->assertJsonCount(count(NotificationType::cases()), 'data');

    $types = collect($response->json('data'))->pluck('type')->all();
    expect($types)->toContain('payment_confirmed', 'audit_approved', 'document_verified');

    // All should default to enabled
    foreach ($response->json('data') as $pref) {
        expect($pref['email_enabled'])->toBeTrue();
        expect($pref['database_enabled'])->toBeTrue();
    }
});

it('returns existing preferences for a user who has customized', function () {
    $user = User::factory()->withRole('company_member')->create();
    NotificationPreference::create([
        'user_id' => $user->id,
        'type' => NotificationType::PaymentConfirmed->value,
        'email_enabled' => false,
        'database_enabled' => true,
    ]);

    $response = $this->actingAs($user)->getJson('/api/v1/notification-preferences');

    $paymentPref = collect($response->json('data'))
        ->firstWhere('type', 'payment_confirmed');

    expect($paymentPref['email_enabled'])->toBeFalse();
    expect($paymentPref['database_enabled'])->toBeTrue();
});

it('requires authentication', function () {
    $this->getJson('/api/v1/notification-preferences')->assertUnauthorized();
});

// ─── Update ──────────────────────────────────────────────────────────────────

it('updates notification preferences', function () {
    $user = User::factory()->withRole('company_member')->create();

    $response = $this->actingAs($user)->putJson('/api/v1/notification-preferences', [
        'preferences' => [
            ['type' => 'payment_confirmed', 'email_enabled' => false, 'database_enabled' => true],
            ['type' => 'audit_approved', 'email_enabled' => true, 'database_enabled' => false],
        ],
    ]);

    $response->assertOk();

    $paymentPref = NotificationPreference::where('user_id', $user->id)
        ->where('type', 'payment_confirmed')->first();
    expect($paymentPref->email_enabled)->toBeFalse();
    expect($paymentPref->database_enabled)->toBeTrue();

    $auditPref = NotificationPreference::where('user_id', $user->id)
        ->where('type', 'audit_approved')->first();
    expect($auditPref->email_enabled)->toBeTrue();
    expect($auditPref->database_enabled)->toBeFalse();
});

it('validates preference types', function () {
    $user = User::factory()->withRole('company_member')->create();

    $this->actingAs($user)->putJson('/api/v1/notification-preferences', [
        'preferences' => [
            ['type' => 'invalid_type', 'email_enabled' => true, 'database_enabled' => true],
        ],
    ])->assertUnprocessable();
});

it('requires authentication for update', function () {
    $this->putJson('/api/v1/notification-preferences', [
        'preferences' => [],
    ])->assertUnauthorized();
});

// ─── Preference service integration ──────────────────────────────────────────

it('respects email_enabled = false when dispatching', function () {
    $user = User::factory()->withRole('company_member')->create();
    NotificationPreference::create([
        'user_id' => $user->id,
        'type' => NotificationType::PaymentConfirmed->value,
        'email_enabled' => false,
        'database_enabled' => true,
    ]);

    $service = new NotificationPreferenceService;
    $channels = $service->getChannels($user, NotificationType::PaymentConfirmed);

    expect($channels)->toBe(['database']);
    expect($channels)->not->toContain('mail');
});

it('respects database_enabled = false when dispatching', function () {
    $user = User::factory()->withRole('company_member')->create();
    NotificationPreference::create([
        'user_id' => $user->id,
        'type' => NotificationType::AuditApproved->value,
        'email_enabled' => true,
        'database_enabled' => false,
    ]);

    $service = new NotificationPreferenceService;
    $channels = $service->getChannels($user, NotificationType::AuditApproved);

    expect($channels)->toBe(['mail']);
    expect($channels)->not->toContain('database');
});

it('returns both channels when both disabled', function () {
    $user = User::factory()->withRole('company_member')->create();
    NotificationPreference::create([
        'user_id' => $user->id,
        'type' => NotificationType::DocumentVerified->value,
        'email_enabled' => false,
        'database_enabled' => false,
    ]);

    $service = new NotificationPreferenceService;
    $channels = $service->getChannels($user, NotificationType::DocumentVerified);

    expect($channels)->toBe([]);
});

it('returns both channels by default when no preference exists', function () {
    $user = User::factory()->withRole('company_member')->create();

    $service = new NotificationPreferenceService;
    $channels = $service->getChannels($user, NotificationType::PaymentConfirmed);

    expect($channels)->toBe(['database', 'mail']);
});
