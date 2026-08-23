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
use App\Exceptions\DuplicateSubscriptionException;
use Illuminate\Support\Str;

class SubscribeToPackageAction
{
    public function __construct(private readonly PaymentGatewayResolver $gatewayResolver) {}

    /** @return array{subscription: Subscription, payment: Payment, gateway_data: array<string, mixed>} */
    public function execute(Company $company, Package $package, PaymentMethod $method): array
    {
        // One live subscription per journey level, across ALL packages of that
        // level (monthly + yearly are separate package rows for the same
        // level). Without this, a company could stack monthly L1 + yearly L1
        // and double-pay for one entitlement. Resubscribing is fine once the
        // previous one expired or was cancelled.
        $liveExists = Subscription::query()
            ->withoutGlobalScope('company')
            ->where('subscriptions.company_id', $company->id)
            ->whereIn('subscriptions.status', [SubscriptionStatus::Pending, SubscriptionStatus::Active])
            ->whereHas('package', fn ($q) => $q->where('packages.journey_level_id', $package->journey_level_id))
            ->exists();

        if ($liveExists) {
            throw new DuplicateSubscriptionException($package);
        }

        $subscription = Subscription::create([
            'company_id' => $company->id,
            'package_id' => $package->id,
            'status' => SubscriptionStatus::Pending,
        ]);

        /** @var Payment $payment */
        $payment = $subscription->payments()->create([
            'company_id' => $company->id,
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
