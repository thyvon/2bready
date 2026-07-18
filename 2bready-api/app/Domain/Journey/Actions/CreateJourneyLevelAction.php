<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\DTOs\JourneyLevelData;
use App\Domain\Journey\Models\JourneyLevel;

class CreateJourneyLevelAction
{
    public function execute(JourneyLevelData $data): JourneyLevel
    {
        return JourneyLevel::create([
            'journey_template_id' => $data->journey_template_id,
            'code' => $data->code,
            'name' => $data->name,
            'pathway_name' => $data->pathway_name,
            'pillar' => $data->pillar,
            'sort_order' => $data->sort_order,
        ]);
    }
}
