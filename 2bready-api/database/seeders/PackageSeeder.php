<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Package\Models\Package;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Compliance Readiness',
                'name_kh' => null,
                'description' => 'Authoritative legal and tax structuring.',
                'price_cents' => 0,
                'billing_period' => BillingPeriod::Yearly,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Product Excellence',
                'name_kh' => null,
                'description' => 'Certified quality and safety standards.',
                'price_cents' => 4900,
                'billing_period' => BillingPeriod::Yearly,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Operational Excellence',
                'name_kh' => null,
                'description' => 'Robust managerial and financial workflows.',
                'price_cents' => 9900,
                'billing_period' => BillingPeriod::Yearly,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Global Readiness',
                'name_kh' => null,
                'description' => 'Institutional investment & export grade.',
                'price_cents' => 19900,
                'billing_period' => BillingPeriod::Yearly,
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($packages as $package) {
            Package::query()->updateOrCreate(
                ['name' => $package['name']],
                $package
            );
        }
    }
}