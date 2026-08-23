<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Marketplace\Actions\ActivateTpHireAction;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Exceptions\InvalidPaymentTransitionException;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Models\Subscription;
use App\Domain\User\Models\User;
use Illuminate\Support\Facades\DB;

/** Admin/finance confirms a payment — activates whatever it paid for. */
class ConfirmPaymentAction
{
    public function __construct(private readonly ActivateTpHireAction $activateTpHire) {}

    public function execute(Payment $payment, User $confirmedBy): Payment
    {
        // A payment can be confirmed straight from pending (e.g. the finance
        // team verified the Stripe reference out-of-band) or after the owner
        // submitted a manual transfer, but never twice: re-confirming would
        // reset started_at/expires_at and silently extend the subscription.
        if (! in_array($payment->status, [PaymentStatus::Pending, PaymentStatus::AwaitingConfirmation], true)) {
            throw new InvalidPaymentTransitionException('This payment has already been resolved and cannot be confirmed again.');
        }

        // Three writes (payment → payable → company) must land together or not
        // at all; a mid-sequence failure would otherwise leave a confirmed
        // payment over an unactivated subscription.
        $payment = DB::transaction(function () use ($payment, $confirmedBy): Payment {
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

            return $payment;
        });

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
