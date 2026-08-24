<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Actions;

use App\Domain\TpPartner\Models\TpPartner;
use Illuminate\Support\Arr;

/**
 * Updates ONLY the per-level prices of a TP partner. The dedicated
 * /pricing endpoint is the one place a firm's own auditors can touch
 * their record (see TpPartnerPolicy::updatePricing) — the fill guard here
 * is the last line of defense: whatever the request carries, nothing but
 * the three price columns may reach the model.
 */
class UpdateTpPartnerPricingAction
{
    /** @param array<string, int|null> $prices */
    public function execute(TpPartner $tpPartner, array $prices): TpPartner
    {
        $tpPartner->fill(Arr::only($prices, ['price_l1_cents', 'price_l2_cents', 'price_l3_cents', 'price_l4_cents']));
        $tpPartner->save();

        return $tpPartner;
    }
}
