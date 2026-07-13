<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Industry\Models\Industry;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Package\Enums\Tier;
use App\Domain\Package\Models\Package;
use Illuminate\Database\Seeder;

// Each package maps 1:1 to a real journey level (via journey_level_id) and
// carries the tier that level requires — this is the real source of truth
// the frontend's LEVEL_META lookup used to hardcode locally (see project
// memory: journey-data.ts's PRICING_BY_LEVEL had the exact same 4 price
// points before it was removed). Scoped to F&B/Cambodia since that's the
// only seeded JourneyTemplate today; a second industry/country needs its
// own 4 packages against its own levels, not a shared price list.
class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $fnb = Industry::query()->where('code', 'F&B')->first();

        if (! $fnb) {
            return;
        }

        $levelsByCode = JourneyLevel::query()
            ->whereHas('journeyTemplate', fn ($q) => $q->where('industry_id', $fnb->id)->where('country_code', 'KH'))
            ->get()
            ->keyBy('code');

        $packages = [
            [
                'name' => 'Compliance Readiness',
                'name_kh' => null,
                'description' => 'Authoritative legal and tax structuring.',
                'price_cents' => 0,
                'billing_period' => BillingPeriod::Yearly,
                'tier' => Tier::Free,
                'level_code' => 'L1',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Product Excellence',
                'name_kh' => null,
                'description' => 'Certified quality and safety standards.',
                'price_cents' => 4900,
                'billing_period' => BillingPeriod::Yearly,
                'tier' => Tier::Pro,
                'level_code' => 'L2',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Operational Excellence',
                'name_kh' => null,
                'description' => 'Robust managerial and financial workflows.',
                'price_cents' => 9900,
                'billing_period' => BillingPeriod::Yearly,
                'tier' => Tier::Pro,
                'level_code' => 'L3',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Global Readiness',
                'name_kh' => null,
                'description' => 'Institutional investment & export grade.',
                'price_cents' => 19900,
                'billing_period' => BillingPeriod::Yearly,
                'tier' => Tier::Enterprise,
                'level_code' => 'L4',
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($packages as $package) {
            $levelCode = $package['level_code'];
            unset($package['level_code']);

            Package::query()->updateOrCreate(
                ['name' => $package['name']],
                [...$package, 'industry_id' => $fnb->id, 'journey_level_id' => $levelsByCode->get($levelCode)?->id],
            );
        }
    }
}
