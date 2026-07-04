<?php

declare(strict_types=1);

namespace App\Domain\Payment\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Package\Models\Package;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Models\Subscription;
use App\Domain\Payment\Services\PaymentGatewayResolver;
use Illuminate\Support\Str;

class SubscribeToPackageAction
{
    public function __construct(private readonly PaymentGatewayResolver $gatewayResolver) {}

    /** @return array{subscription: Subscription, payment: Payment, gateway_data: array<string, mixed>} */
    public function execute(Company $company, Package $package, PaymentMethod $method): array
    {
        $subscription = Subscription::create([
            'company_id' => $company->id,
            'package_id' => $package->id,
            'status' => SubscriptionStatus::Pending,
        ]);

        $payment = Payment::create([
            'company_id' => $company->id,
            'subscription_id' => $subscription->id,
            'amount_cents' => $package->price_cents,
            'currency' => 'USD',
            'method' => $method,
            'status' => PaymentStatus::Pending,
            'gateway_reference' => strtoupper(Str::random(10)),
        ]);

        $gatewayData = $this->gatewayResolver->resolve($method)->initiate($payment);

        return ['subscription' => $subscription, 'payment' => $payment, 'gateway_data' => $gatewayData];
    }
}
