<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\DTOs\JourneyTemplateData;
use App\Domain\Journey\Models\JourneyTemplate;

class CreateJourneyTemplateAction
{
    public function execute(JourneyTemplateData $data): JourneyTemplate
    {
        return JourneyTemplate::create([
            'country_code' => $data->country_code,
            'industry_id' => $data->industry_id,
            'name' => $data->name,
            'name_kh' => $data->name_kh,
            'is_active' => $data->is_active,
        ]);
    }
}
