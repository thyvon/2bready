<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\Models\JourneyTemplate;

class UpdateJourneyTemplateAction
{
    /** @param array<string, mixed> $data */
    public function execute(JourneyTemplate $journeyTemplate, array $data): JourneyTemplate
    {
        $journeyTemplate->update($data);

        return $journeyTemplate;
    }
}
