<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Marketplace\Actions\ActivateTpHireAction;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Models\Subscription;
use App\Domain\User\Models\User;

/** Admin/finance confirms a payment — activates whatever it paid for. */
class ConfirmPaymentAction
{
    public function __construct(private readonly ActivateTpHireAction $activateTpHire) {}

    public function execute(Payment $payment, User $confirmedBy): Payment
    {
        $payment->update([
            'status' => PaymentStatus::Confirmed,
            'confirmed_by' => $confirmedBy->id,
            'confirmed_at' => now(),
        ]);

        $payable = $payment->payable;

        match (true) {
            $payable instanceof Subscription => $this->activateSubscription($payable),
            $payable instanceof TpHire => $this->activateTpHire->execute($payable),
            default => null,
        };

        return $payment->fresh();
    }

    private function activateSubscription(Subscription $subscription): void
    {
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
    }
}
