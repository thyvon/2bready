<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\Models\JourneyLevel;

class DeleteJourneyLevelAction
{
    public function execute(JourneyLevel $journeyLevel): void
    {
        $journeyLevel->delete();
    }
}
