<?php

declare(strict_types=1);

namespace App\Domain\Package\Actions;

use App\Domain\Package\DTOs\PackageData;
use App\Domain\Package\Models\Package;

class CreatePackageAction
{
    public function execute(PackageData $data): Package
    {
        return Package::create([
            'industry_id' => $data->industry_id,
            'journey_level_id' => $data->journey_level_id,
            'name' => $data->name,
            'name_kh' => $data->name_kh,
            'description' => $data->description,
            'price_cents' => $data->price_cents,
            'billing_period' => $data->billing_period,
            'tier' => $data->tier,
            'is_active' => $data->is_active,
            'sort_order' => $data->sort_order,
        ]);
    }
}
