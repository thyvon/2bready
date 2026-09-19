<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Notification\Enums\NotificationType;
use App\Domain\Notification\Notifications\SubscriptionCancelledNotification;
use App\Domain\Notification\Traits\DispatchesWithPreferences;
use App\Domain\Payment\Events\SubscriptionCancelled;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendSubscriptionCancelledNotification implements ShouldQueue
{
    use DispatchesWithPreferences;

    public function handle(SubscriptionCancelled $event): void
    {
        $subscription = $event->subscription->loadMissing(['company.users', 'package']);

        $company = $subscription->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $this->notifyWithPreferences(
                $user,
                SubscriptionCancelledNotification::forSubscription($subscription),
                NotificationType::SubscriptionCancelled,
            );
        }
    }
}
