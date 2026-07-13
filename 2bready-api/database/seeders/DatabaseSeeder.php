<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            PlatformSettingSeeder::class,
            IndustrySeeder::class,
            JourneyTemplateSeeder::class,
            DocumentTemplateSeeder::class,
            // Depends on IndustrySeeder + JourneyTemplateSeeder for the
            // industry_id/journey_level_id lookups it needs — was never
            // actually called here before (pre-existing gap, unrelated to
            // this session's earlier work), so `packages` was empty on a
            // fresh migrate:fresh --seed until now.
            PackageSeeder::class,
        ]);
    }
}
