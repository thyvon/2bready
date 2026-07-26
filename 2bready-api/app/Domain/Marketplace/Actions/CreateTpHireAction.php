<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Marketplace\DTOs\TpHireData;
use App\Domain\Marketplace\Enums\TpHirePayoutStatus;
use App\Domain\Marketplace\Enums\TpHireStatus;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Services\PaymentGatewayResolver;
use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;
use App\Exceptions\TpPartnerHasNoPriceException;
use Illuminate\Support\Str;

/**
 * Admin picks a company + TpPartner + journey level → this creates the hire
 * (pending_payment) and the Payment the company must pay, reusing the exact
 * same gateway machinery SubscribeToPackageAction already uses for packages.
 * No self-service company-initiated hire yet (Sprint 7 marketplace) — this
 * is the only entry point in v1, always admin-initiated.
 */
class CreateTpHireAction
{
    public function __construct(
        private readonly PaymentGatewayResolver $gatewayResolver,
        private readonly PlatformSettingService $settings,
    ) {}

    /** @return array{tp_hire: TpHire, payment: Payment, gateway_data: array<string, mixed>} */
    public function execute(TpHireData $data, User $assignedBy): array
    {
        $company = Company::query()->findOrFail($data->company_id);
        $tpPartner = TpPartner::query()->findOrFail($data->tp_partner_id);

        // Snapshotted now — a later price change on the firm never
        // retroactively affects this hire (mirrors Payment.amount_cents
        // being snapshotted from package.price_cents at subscribe time).
        $priceAgreedCents = $tpPartner->priceFor($data->journey_level);

        if ($priceAgreedCents === null) {
            throw new TpPartnerHasNoPriceException($data->journey_level);
        }

        $commissionPercent = (float) $this->settings->get('marketplace.commission_percent', 15);
        $commissionCents = (int) round($priceAgreedCents * $commissionPercent / 100);
        $payoutCents = $priceAgreedCents - $commissionCents;

        $tpHire = TpHire::create([
            'company_id' => $company->id,
            'tp_partner_id' => $tpPartner->id,
            'journey_level' => $data->journey_level,
            'price_agreed_cents' => $priceAgreedCents,
            'platform_commission_cents' => $commissionCents,
            'tp_payout_cents' => $payoutCents,
            'status' => TpHireStatus::PendingPayment,
            'payout_status' => TpHirePayoutStatus::Unpaid,
            'assigned_by_user_id' => $assignedBy->id,
        ]);

        $method = PaymentMethod::from($data->method);

        /** @var Payment $payment */
        $payment = $tpHire->payments()->create([
            'company_id' => $company->id,
            'amount_cents' => $priceAgreedCents,
            'currency' => 'USD',
            'method' => $method,
            'status' => PaymentStatus::Pending,
            'gateway_reference' => strtoupper(Str::random(10)),
        ]);

        $gatewayData = $this->gatewayResolver->resolve($method)->initiate($payment);

        return ['tp_hire' => $tpHire, 'payment' => $payment, 'gateway_data' => $gatewayData];
    }
}
