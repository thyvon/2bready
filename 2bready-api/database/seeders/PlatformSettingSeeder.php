<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Shared\Services\PlatformSettingService;
use Illuminate\Database\Seeder;

class PlatformSettingSeeder extends Seeder
{
    public function run(PlatformSettingService $settings): void
    {
        $settings->set('bypass_employee_threshold', 8, 'compliance');
    }
}
