<?php

declare(strict_types=1);

use App\Domain\Payment\Actions\ExpireOverdueSubscriptionsAction;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Models\Subscription;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('expires active subscriptions whose expires_at has passed', function () {
    $overdue = Subscription::factory()->active()->create(['expires_at' => now()->subDay()]);

    $count = (new ExpireOverdueSubscriptionsAction)->execute();

    expect($count)->toBe(1)
        ->and($overdue->fresh()->status)->toBe(SubscriptionStatus::Expired);
});

it('leaves active subscriptions that have not expired yet', function () {
    $current = Subscription::factory()->active()->create(['expires_at' => now()->addMonth()]);
    Subscription::factory()->active()->create(['expires_at' => now()->addMinute()]);

    $count = (new ExpireOverdueSubscriptionsAction)->execute();

    expect($count)->toBe(0)
        ->and($current->fresh()->status)->toBe(SubscriptionStatus::Active);
});

it('never expires one-time purchases with no expiry date', function () {
    // One-time packages are sold as perpetual entitlements — expires_at null.
    $perpetual = Subscription::factory()->active()->create(['expires_at' => null]);

    $count = (new ExpireOverdueSubscriptionsAction)->execute();

    expect($count)->toBe(0)
        ->and($perpetual->fresh()->status)->toBe(SubscriptionStatus::Active);
});

it('does not touch subscriptions that are not active', function () {
    // Pending/cancelled/expired rows keep their own lifecycle — the sweep
    // only ever moves active → expired, nothing else.
    $pending = Subscription::factory()->create(['status' => 'pending', 'expires_at' => now()->subDay()]);
    $cancelled = Subscription::factory()->create(['status' => 'cancelled', 'expires_at' => now()->subDay()]);
    $alreadyExpired = Subscription::factory()->active()->create(['expires_at' => now()->subWeek(), 'status' => 'expired']);

    $count = (new ExpireOverdueSubscriptionsAction)->execute();

    expect($count)->toBe(0)
        ->and($pending->fresh()->status->value)->toBe('pending')
        ->and($cancelled->fresh()->status->value)->toBe('cancelled')
        ->and($alreadyExpired->fresh()->status->value)->toBe('expired');
});
