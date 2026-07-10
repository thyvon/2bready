<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Industry\Models\Industry;
use Illuminate\Database\Seeder;

class IndustrySeeder extends Seeder
{
    public function run(): void
    {
        // Coarse categories matching the frontend's INDUSTRY_OPTIONS
        // (2bready-web/apps/client-portal/src/lib/company-setup-schema.ts) —
        // not the full CSIC sub-level dataset (876 codes), which is explicitly
        // deferred. This table is what the frontend list should migrate to
        // fetching from, rather than staying hardcoded.
        $industries = [
            ['code' => 'F&B', 'name' => 'Food & Beverage', 'sort_order' => 1],
            ['code' => 'RETAIL', 'name' => 'Retail & Trade', 'sort_order' => 2],
            ['code' => 'MANUFACTURING', 'name' => 'Manufacturing', 'sort_order' => 3],
            ['code' => 'SERVICES', 'name' => 'Services', 'sort_order' => 4],
            ['code' => 'OTHER', 'name' => 'Other', 'sort_order' => 5],
        ];

        foreach ($industries as $industry) {
            Industry::query()->updateOrCreate(
                ['code' => $industry['code']],
                $industry,
            );
        }
    }
}
