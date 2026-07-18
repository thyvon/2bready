<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\DTOs\MilestoneData;
use App\Domain\Journey\Models\Milestone;

class CreateMilestoneAction
{
    public function execute(MilestoneData $data): Milestone
    {
        return Milestone::create([
            'journey_level_id' => $data->journey_level_id,
            'name' => $data->name,
            'sort_order' => $data->sort_order,
        ]);
    }
}
