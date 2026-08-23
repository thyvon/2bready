<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Actions;

use App\Domain\Marketplace\Enums\TpHireStatus;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Shared\Services\PlatformSettingService;
use App\Exceptions\HireNotEditableException;
use App\Exceptions\TpPartnerHasNoPriceException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Edits a hire while it is still pending_payment (money has not moved).
 * Changing the level re-snapshots the price from the firm's current pricing
 * and recomputes commission/payout, and keeps the open payment in sync so
 * the company is charged the right amount — without voiding the payment
 * reference the owner may already be mid-transfer against.
 */
class UpdateTpHireAction
{
    public function __construct(private readonly PlatformSettingService $settings) {}

    public function execute(TpHire $tpHire, string $journeyLevel): TpHire
    {
        if ($tpHire->status !== TpHireStatus::PendingPayment) {
            throw new HireNotEditableException;
        }

        $priceAgreedCents = $tpHire->tpPartner->priceFor($journeyLevel);

        if ($priceAgreedCents === null) {
            throw new TpPartnerHasNoPriceException($journeyLevel);
        }

        return DB::transaction(function () use ($tpHire, $journeyLevel, $priceAgreedCents): TpHire {
            // Same snapshot arithmetic as CreateTpHireAction — a hire's money
            // trio must always be internally consistent with its level.
            $commissionPercent = (float) $this->settings->get('marketplace.commission_percent', 15);
            $commissionCents = (int) round($priceAgreedCents * $commissionPercent / 100);

            $tpHire->update([
                'journey_level' => $journeyLevel,
                'price_agreed_cents' => $priceAgreedCents,
                'platform_commission_cents' => $commissionCents,
                'tp_payout_cents' => $priceAgreedCents - $commissionCents,
            ]);

            // Keep the open payment aligned; only a pending one can exist for
            // a pending_payment hire (cancel sweeps everything else to failed,
            // and confirmation would have activated the hire). If it was
            // somehow swept already, recreate one so the hire stays payable.
            /** @var Payment|null $openPayment */
            $openPayment = $tpHire->payments()
                ->where('status', PaymentStatus::Pending)
                ->latest()
                ->first();

            if ($openPayment !== null) {
                $openPayment->update(['amount_cents' => $priceAgreedCents]);
            } else {
                $tpHire->payments()->create([
                    'company_id' => $tpHire->company_id,
                    'amount_cents' => $priceAgreedCents,
                    'currency' => 'USD',
                    'method' => PaymentMethod::ManualBankTransfer,
                    'status' => PaymentStatus::Pending,
                    'gateway_reference' => strtoupper(Str::random(10)),
                ]);
            }

            return $tpHire->fresh();
        });
    }
}
