<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Exceptions\InvalidPaymentTransitionException;
use App\Domain\Payment\Models\Payment;

/** Company marks a manual bank transfer as sent — a human still has to confirm it. */
class SubmitManualPaymentAction
{
    public function execute(Payment $payment): Payment
    {
        // Only a fresh, unpaid manual transfer can be "sent". Re-submitting a
        // confirmed payment here would desynchronize it from its (active)
        // subscription, and Stripe-method payments are confirmed by the
        // gateway flow, never by this endpoint.
        if ($payment->status !== PaymentStatus::Pending) {
            throw new InvalidPaymentTransitionException('Only a pending payment can be marked as sent.');
        }

        if ($payment->method !== PaymentMethod::ManualBankTransfer) {
            throw new InvalidPaymentTransitionException('Only manual bank transfer payments can be marked as sent.');
        }

        $payment->update([
            'status' => PaymentStatus::AwaitingConfirmation,
            'submitted_at' => now(),
        ]);

        return $payment;
    }
}
