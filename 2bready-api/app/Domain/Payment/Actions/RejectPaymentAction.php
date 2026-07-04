<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;

class RejectPaymentAction
{
    public function execute(Payment $payment): Payment
    {
        $payment->update(['status' => PaymentStatus::Rejected]);

        return $payment;
    }
}
