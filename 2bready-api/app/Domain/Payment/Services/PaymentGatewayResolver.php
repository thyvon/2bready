<?php

declare(strict_types=1);

namespace App\Domain\Payment\Services;

use App\Domain\Payment\Contracts\PaymentGatewayInterface;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Gateways\FakeStripeGateway;
use App\Domain\Payment\Gateways\ManualBankTransferGateway;

class PaymentGatewayResolver
{
    public function __construct(
        private readonly ManualBankTransferGateway $manualBankTransferGateway,
        private readonly FakeStripeGateway $fakeStripeGateway,
    ) {}

    public function resolve(PaymentMethod $method): PaymentGatewayInterface
    {
        return match ($method) {
            PaymentMethod::ManualBankTransfer => $this->manualBankTransferGateway,
            PaymentMethod::Stripe => $this->fakeStripeGateway,
        };
    }
}
