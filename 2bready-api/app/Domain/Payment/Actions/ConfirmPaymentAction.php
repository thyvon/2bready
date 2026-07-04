<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\User\Models\User;

/** Admin/finance confirms a payment — activates the subscription and the company follows it. */
class ConfirmPaymentAction
{
    public function execute(Payment $payment, User $confirmedBy): Payment
    {
        $payment->update([
            'status' => PaymentStatus::Confirmed,
            'confirmed_by' => $confirmedBy->id,
            'confirmed_at' => now(),
        ]);

        $subscription = $payment->subscription;
        $package = $subscription->package;

        $expiresAt = match ($package->billing_period) {
            BillingPeriod::Monthly => now()->addMonth(),
            BillingPeriod::Yearly => now()->addYear(),
            BillingPeriod::OneTime => null,
        };

        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'started_at' => now(),
            'expires_at' => $expiresAt,
        ]);

        $subscription->company->update(['active_subscription_id' => $subscription->id]);

        return $payment->fresh();
    }
}
