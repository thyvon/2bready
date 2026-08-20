<?php

declare(strict_types=1);

namespace App\Domain\Package\Actions;

use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Package\Models\Package;
use Illuminate\Support\Facades\DB;

/**
 * Updates a journey-level package group. The representative row (any billing
 * period — the frontend always passes the group's representative id) carries
 * the shared fields (name, tier, ...); per-period prices travel separately as
 * `monthly_price_cents` / `yearly_price_cents` and are applied to the matching
 * row (the sibling found by journey_level_id). Returns the representative with
 * `prices` loaded.
 */
class UpdatePackageAction
{
    /** @param array<string, mixed> $data */
    public function execute(Package $package, array $data): Package
    {
        return DB::transaction(function () use ($package, $data) {
            $shared = array_diff_key($data, array_flip(['monthly_price_cents', 'yearly_price_cents']));

            $sibling = $this->findSibling($package);

            $package->update([
                ...$shared,
                'price_cents' => $this->priceFor($package, $data),
            ]);

            $siblingPeriod = match ($package->billing_period) {
                BillingPeriod::Monthly => BillingPeriod::Yearly,
                BillingPeriod::Yearly => BillingPeriod::Monthly,
                BillingPeriod::OneTime => null,
            };

            // Packages created before the monthly/yearly split only carry one
            // billing-period row. If a price was submitted for the missing
            // period, materialize the sibling row instead of silently dropping
            // it — otherwise the monthly price "save" would no-op.
            if ($sibling === null
                && $siblingPeriod !== null
                && array_key_exists($siblingPeriod->value.'_price_cents', $data)
            ) {
                $sibling = Package::query()->create([
                    'name' => $package->name,
                    'name_kh' => $package->name_kh,
                    'description' => $package->description,
                    'industry_id' => $package->industry_id,
                    'journey_level_id' => $package->journey_level_id,
                    'tier' => $package->tier,
                    'is_active' => $package->is_active,
                    'sort_order' => $package->sort_order,
                    'billing_period' => $siblingPeriod,
                    'price_cents' => $this->priceFor($package, $data),
                ]);
            }

            if ($sibling !== null) {
                $sibling->update([
                    ...$shared,
                    'price_cents' => $this->priceFor($sibling, $data),
                ]);
            }

            $package->setRelation('prices', collect([$sibling, $package])->filter()->sortBy(
                fn (Package $row) => $row->billing_period === BillingPeriod::Yearly,
            )->values());

            return $package;
        });
    }

    private function findSibling(Package $package): ?Package
    {
        if (! $package->journey_level_id) {
            return null;
        }

        return Package::query()
            ->where('journey_level_id', $package->journey_level_id)
            ->where('industry_id', $package->industry_id)
            ->where('billing_period', '!=', $package->billing_period)
            ->where('id', '!=', $package->id)
            ->first();
    }

    /** @param array<string, mixed> $data */
    private function priceFor(Package $package, array $data): int
    {
        return match ($package->billing_period) {
            BillingPeriod::Monthly => $data['monthly_price_cents'] ?? $package->price_cents,
            BillingPeriod::Yearly => $data['yearly_price_cents'] ?? $package->price_cents,
            BillingPeriod::OneTime => $data['price_cents'] ?? $package->price_cents,
        };
    }
}
