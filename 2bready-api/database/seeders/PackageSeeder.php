<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Industry\Models\Industry;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Package\Enums\Tier;
use App\Domain\Package\Models\Package;
use Illuminate\Database\Seeder;

// Each package maps 1:1 to a real journey level (via journey_level_id) and
// carries the tier that level requires — this is the real source of truth
// the frontend's LEVEL_META lookup used to hardcode locally (see project
// memory: journey-data.ts's PRICING_BY_LEVEL had the exact same 4 price
// points before it was removed). Scoped to F&B/Cambodia since that's the
// only seeded JourneyTemplate today; a second industry/country needs its
// own level set against its own levels, not a shared price list.
//
// Each level gets TWO rows — one monthly and one yearly — so customers pick
// their billing cadence at subscribe time (client billing page toggle). The
// two rows are keyed on (journey_level_id, billing_period), not name, so
// they never collapse into a single row.
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

        // Two billing options per level: a monthly and a yearly row, so a
        // customer can pick the cadence at subscribe time (see the client
        // billing page's Monthly/Yearly toggle). Monthly is seeded as
        // yearly/10 (10 months ≈ 1 year is a common SaaS default); both are
        // admin-editable via the packages screen — mockup defaults only.
        $packages = [
            ['name' => 'Compliance Readiness', 'name_kh' => null, 'description' => 'Authoritative legal and tax structuring.', 'tier' => Tier::Starter, 'level_code' => 'L1', 'sort_order' => 1, 'prices' => ['monthly' => 1900, 'yearly' => 19000]],
            ['name' => 'Product Excellence', 'name_kh' => null, 'description' => 'Certified quality and safety standards.', 'tier' => Tier::Pro, 'level_code' => 'L2', 'sort_order' => 2, 'prices' => ['monthly' => 490, 'yearly' => 4900]],
            ['name' => 'Operational Excellence', 'name_kh' => null, 'description' => 'Robust managerial and financial workflows.', 'tier' => Tier::Pro, 'level_code' => 'L3', 'sort_order' => 3, 'prices' => ['monthly' => 990, 'yearly' => 9900]],
            ['name' => 'Global Readiness', 'name_kh' => null, 'description' => 'Institutional investment & export grade.', 'tier' => Tier::Enterprise, 'level_code' => 'L4', 'sort_order' => 4, 'prices' => ['monthly' => 1990, 'yearly' => 19900]],
        ];

        foreach ($packages as $package) {
            $levelCode = $package['level_code'];
            $prices = $package['prices'];
            unset($package['level_code'], $package['prices']);

            $level = $levelsByCode->get($levelCode);

            foreach ($prices as $period => $priceCents) {
                Package::query()->updateOrCreate(
                    ['journey_level_id' => $level?->id, 'billing_period' => $period],
                    [
                        ...$package,
                        'price_cents' => $priceCents,
                        'billing_period' => $period,
                        'industry_id' => $fnb->id,
                        'journey_level_id' => $level?->id,
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
