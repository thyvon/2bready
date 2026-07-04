<?php

declare(strict_types=1);

namespace App\Domain\Payment\Gateways;

use App\Domain\Payment\Contracts\PaymentGatewayInterface;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Models\Payment;
use Illuminate\Support\Str;

/**
 * Placeholder implementation, bound in AppServiceProvider until real Stripe
 * test-mode keys are supplied. Returns a fake client secret rather than
 * calling Stripe, so the rest of the checkout flow (frontend included) can be
 * built and tested end-to-end now — swap this binding for a real
 * StripeGateway (same interface) once keys land, no other code changes.
 */
class FakeStripeGateway implements PaymentGatewayInterface
{
    public function method(): PaymentMethod
    {
        return PaymentMethod::Stripe;
    }

    /** @return array<string, mixed> */
    public function initiate(Payment $payment): array
    {
        return [
            'stub' => true,
            'client_secret' => 'fake_pi_'.Str::random(24).'_secret_'.Str::random(16),
            'amount_cents' => $payment->amount_cents,
            'currency' => $payment->currency,
        ];
    }
}
