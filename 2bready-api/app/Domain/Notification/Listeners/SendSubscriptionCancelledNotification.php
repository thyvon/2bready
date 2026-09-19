<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Company\Models\Company;
use App\Domain\Notification\Notifications\SubscriptionCancelledNotification;
use App\Domain\Payment\Events\SubscriptionCancelled;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifies a company's users when their subscription is cancelled.
 * Cross-domain: event lives in Payment, listener in Notification.
 */
class SendSubscriptionCancelledNotification implements ShouldQueue
{
    public function handle(SubscriptionCancelled $event): void
    {
        $subscription = $event->subscription->loadMissing(['company.users', 'package']);

        /** @var Company|null $company */
        $company = $subscription->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $user->notify(SubscriptionCancelledNotification::forSubscription($subscription));
        }
    }
}
