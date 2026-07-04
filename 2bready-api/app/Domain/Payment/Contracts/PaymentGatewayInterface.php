<?php

declare(strict_types=1);

namespace App\Domain\Payment\Contracts;

use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Models\Payment;

interface PaymentGatewayInterface
{
    public function method(): PaymentMethod;

    /**
     * Kick off payment collection for a freshly-created, still-pending Payment.
     * Returns whatever the frontend needs to complete the flow — a Stripe client
     * secret, or the bank account details + reference number to display for a
     * manual transfer. Shape is gateway-specific by design; the frontend branches
     * on `method` to know how to render it.
     *
     * @return array<string, mixed>
     */
    public function initiate(Payment $payment): array;
}
