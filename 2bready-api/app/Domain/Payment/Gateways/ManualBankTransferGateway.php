<?php

declare(strict_types=1);

namespace App\Domain\Payment\Gateways;

use App\Domain\Payment\Contracts\PaymentGatewayInterface;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Models\Payment;

class ManualBankTransferGateway implements PaymentGatewayInterface
{
    public function method(): PaymentMethod
    {
        return PaymentMethod::ManualBankTransfer;
    }

    /** @return array<string, mixed> */
    public function initiate(Payment $payment): array
    {
        return [
            'bank_name' => config('payment.bank_transfer.bank_name'),
            'account_name' => config('payment.bank_transfer.account_name'),
            'account_number' => config('payment.bank_transfer.account_number'),
            'reference' => $payment->gateway_reference,
            'amount_cents' => $payment->amount_cents,
            'currency' => $payment->currency,
        ];
    }
}
