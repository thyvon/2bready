<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Exceptions\InvalidPaymentTransitionException;
use App\Domain\Payment\Models\Payment;
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
        });

        return $payment;
    }
}
