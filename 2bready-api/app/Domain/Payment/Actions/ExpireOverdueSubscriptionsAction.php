<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Models\Subscription;

/**
 * Runs daily (see ExpireSubscriptionsJob / routes/console.php). A paid
 * subscription whose expires_at has passed no longer entitles the company to
 * its journey level — this is the only place SubscriptionStatus::Expired
 * ever gets set. Without it, entitlements accumulated forever (the cap in
 * JourneyProgressService reads active subscriptions), so a monthly plan
 * would silently become a lifetime one.
 *
 * One-time purchases have expires_at = null and are never touched — a
 * perpetual entitlement is exactly what they were sold as.
 */
class ExpireOverdueSubscriptionsAction
{
    public function execute(): int
    {
        return Subscription::query()
            ->where('status', SubscriptionStatus::Active)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => SubscriptionStatus::Expired]);
    }
}
