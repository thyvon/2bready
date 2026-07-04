<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;

/** Company marks a manual bank transfer as sent — a human still has to confirm it. */
class SubmitManualPaymentAction
{
    public function execute(Payment $payment): Payment
    {
        $payment->update([
            'status' => PaymentStatus::AwaitingConfirmation,
            'submitted_at' => now(),
        ]);

        return $payment;
    }
}
