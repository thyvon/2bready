<?php

declare(strict_types=1);

namespace App\Domain\Industry\Actions;

use App\Domain\Industry\DTOs\IndustryData;
use App\Domain\Industry\Models\Industry;

class CreateIndustryAction
{
    public function execute(IndustryData $data): Industry
    {
        return Industry::create([
            'code' => $data->code,
            'name' => $data->name,
            'name_kh' => $data->name_kh,
            'description' => $data->description,
            'is_active' => $data->is_active,
            'sort_order' => $data->sort_order,
        ]);
    }
}
