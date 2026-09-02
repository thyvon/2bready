<?php

declare(strict_types=1);

namespace App\Domain\Package\Actions;

use App\Domain\Package\DTOs\PackageData;
use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Package\Models\Package;
use Illuminate\Support\Facades\DB;

/**
 * Creates the full billing-period set for a journey-level package — a monthly
 * and a yearly Package row with the same identity/name/tier, only the price
 * differing. Subscription records still point at a single row (its exact
 * billing period), so the rows are kept separate in storage; only the API
 * view groups them. Returns the yearly representative with its sibling rows
 * loaded as `prices`.
 */
class CreatePackageAction
{
    public function execute(PackageData $data): Package
    {
        return DB::transaction(function () use ($data) {
            $rows = [];
            foreach ([BillingPeriod::Monthly, BillingPeriod::Yearly] as $period) {
                $rows[$period->value] = Package::create([
                    'industry_id' => $data->industry_id,
                    'journey_level_id' => $data->journey_level_id,
                    'name' => $data->name,
                    'name_kh' => $data->name_kh,
                    'description' => $data->description,
                    'price_cents' => $period === BillingPeriod::Monthly ? $data->monthly_price_cents : $data->yearly_price_cents,
                    'billing_period' => $period,
                    'tier' => $data->tier,
                    'is_active' => $data->is_active,
                    'sort_order' => $data->sort_order,
                ]);
            }

            /** @var Package $representative */
            $representative = $rows[BillingPeriod::Yearly->value];
            $representative->setRelation('prices', collect($rows)->sortBy(
                fn (Package $row) => $row->billing_period === BillingPeriod::Yearly,
            )->values());

            return $representative;
        });
    }
}
