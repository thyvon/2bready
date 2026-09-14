<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Events\PaymentRejected;
use App\Domain\Payment\Exceptions\InvalidPaymentTransitionException;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Models\Subscription;
use Illuminate\Support\Facades\DB;

class RejectPaymentAction
{
    public function execute(Payment $payment): Payment
    {
        // Only an unresolved payment can be rejected — rejecting a confirmed
        // payment would imply revoking an already-activated subscription,
        // which is a separate (cancellation) flow, not a queue action.
        if (! in_array($payment->status, [PaymentStatus::Pending, PaymentStatus::AwaitingConfirmation], true)) {
            throw new InvalidPaymentTransitionException('This payment has already been resolved and cannot be rejected.');
        }

        DB::transaction(function () use ($payment): void {
            $payment->update(['status' => PaymentStatus::Rejected]);

            // Cancel the associated subscription if it's still pending —
            // without this, a rejected payment leaves the subscription stuck
            // as pending forever, blocking the company from resubscribing.
            $payable = $payment->payable;
            if ($payable instanceof Subscription && $payable->status === SubscriptionStatus::Pending) {
                $payable->update(['status' => SubscriptionStatus::Cancelled]);
            }
        });

        event(new PaymentRejected($payment));

        return $payment;
    }
}
