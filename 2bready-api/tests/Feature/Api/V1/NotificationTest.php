<?php

declare(strict_types=1);

use App\Domain\Notification\Notifications\PaymentConfirmedNotification;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createNotification(User $user, array $overrides = []): DatabaseNotification
{
    return $user->notifications()->create(array_merge([
        'id' => Str::ulid(),
        'type' => PaymentConfirmedNotification::class,
        'data' => ['title' => 'Test', 'message' => 'Test message'],
    ], $overrides));
}

// ─── Index (list) ────────────────────────────────────────────────────────────

it('returns paginated notifications for the authenticated user', function () {
    $user = User::factory()->withRole('company_member')->create();
    createNotification($user, ['data' => ['title' => 'Payment confirmed', 'message' => 'Your payment was confirmed.']]);
    createNotification($user, ['data' => ['title' => 'Audit approved', 'message' => 'Your audit was approved.']]);

    $response = $this->actingAs($user)->getJson('/api/v1/notifications');

    $response->assertOk()
        ->assertJsonPath('meta.pagination.total', 2)
        ->assertJsonPath('meta.unread_count', 2);

    $titles = collect($response->json('data'))->pluck('data.title')->all();
    expect($titles)->toContain('Payment confirmed', 'Audit approved');
});

it('returns only unread count', function () {
    $user = User::factory()->withRole('company_member')->create();
    $notification = createNotification($user);

    $this->actingAs($user)->getJson('/api/v1/notifications')
        ->assertJsonPath('meta.unread_count', 1);

    $notification->markAsRead();

    $this->actingAs($user)->getJson('/api/v1/notifications')
        ->assertJsonPath('meta.unread_count', 0);
});

it('requires authentication', function () {
    $this->getJson('/api/v1/notifications')->assertUnauthorized();
});

// ─── Mark as read ────────────────────────────────────────────────────────────

it('marks a single notification as read', function () {
    $user = User::factory()->withRole('company_member')->create();
    $notification = createNotification($user);

    $response = $this->actingAs($user)->postJson("/api/v1/notifications/{$notification->id}/read");

    $response->assertOk()
        ->assertJsonPath('data.read_at', fn ($v) => $v !== null);

    expect($notification->fresh()->read_at)->not->toBeNull();
});

it('returns 404 for non-existent notification', function () {
    $user = User::factory()->withRole('company_member')->create();

    $this->actingAs($user)->postJson('/api/v1/notifications/01JARANDOMNOTEXIST000001/read')
        ->assertNotFound();
});

it('does not modify already-read notification', function () {
    $user = User::factory()->withRole('company_member')->create();
    $notification = createNotification($user);
    $notification->markAsRead();
    $originalReadAt = $notification->fresh()->read_at;

    $this->actingAs($user)->postJson("/api/v1/notifications/{$notification->id}/read")
        ->assertOk();

    expect($notification->fresh()->read_at)->toEqual($originalReadAt);
});

// ─── Mark all as read ────────────────────────────────────────────────────────

it('marks all notifications as read', function () {
    $user = User::factory()->withRole('company_member')->create();
    createNotification($user);
    createNotification($user);
    createNotification($user);

    $this->actingAs($user)->postJson('/api/v1/notifications/read-all')
        ->assertNoContent();

    expect($user->unreadNotifications()->count())->toBe(0);
});

it('requires authentication for mark all as read', function () {
    $this->postJson('/api/v1/notifications/read-all')->assertUnauthorized();
});

// ─── Scoping ─────────────────────────────────────────────────────────────────

it('does not return other users notifications', function () {
    $user = User::factory()->withRole('company_member')->create();
    $otherUser = User::factory()->withRole('company_member')->create();

    createNotification($user, ['data' => ['title' => 'My notification', 'message' => '...']]);
    createNotification($otherUser, ['data' => ['title' => 'Other notification', 'message' => '...']]);

    $response = $this->actingAs($user)->getJson('/api/v1/notifications');

    $response->assertOk()
        ->assertJsonPath('meta.pagination.total', 1)
        ->assertJsonPath('data.0.data.title', 'My notification');
});
