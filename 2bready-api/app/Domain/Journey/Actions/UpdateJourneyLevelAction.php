<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\Models\JourneyLevel;

class UpdateJourneyLevelAction
{
    /** @param array<string, mixed> $data */
    public function execute(JourneyLevel $journeyLevel, array $data): JourneyLevel
    {
        $journeyLevel->update($data);

        return $journeyLevel;
    }
}
