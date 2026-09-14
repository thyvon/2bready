<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Events\SubscriptionCancelled;
use App\Domain\Payment\Exceptions\InvalidPaymentTransitionException;
use App\Domain\Payment\Models\Subscription;
use Illuminate\Support\Facades\DB;

class CancelSubscriptionAction
{
    public function execute(Subscription $subscription): Subscription
    {
        // Only a pending or active subscription can be cancelled — expired or
        // already-cancelled subscriptions need no action.
        if (! in_array($subscription->status, [SubscriptionStatus::Pending, SubscriptionStatus::Active], true)) {
            throw new InvalidPaymentTransitionException('This subscription cannot be cancelled.');
        }

        DB::transaction(function () use ($subscription): void {
            // Reject any pending/awaiting payments tied to this subscription
            // so they don't linger in the queue.
            $subscription->payments()
                ->whereIn('status', [PaymentStatus::Pending, PaymentStatus::AwaitingConfirmation])
                ->update(['status' => PaymentStatus::Rejected]);

            $subscription->update(['status' => SubscriptionStatus::Cancelled]);
        });

        event(new SubscriptionCancelled($subscription->fresh()));

        return $subscription->fresh();
    }
}
