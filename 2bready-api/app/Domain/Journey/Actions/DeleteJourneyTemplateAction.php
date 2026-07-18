<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\Models\JourneyTemplate;
use Illuminate\Validation\ValidationException;

class DeleteJourneyTemplateAction
{
    public function execute(JourneyTemplate $journeyTemplate): void
    {
        // No self-service recovery path exists for "a company's Journey points
        // at a deleted template" — its journey tree would silently stop
        // resolving. Same guard shape as UpdateCompanyUserAction's last-owner
        // check: block the specific transition that would orphan live data.
        if ($journeyTemplate->journeys()->exists()) {
            throw ValidationException::withMessages([
                'journey_template' => ['This template is in use by at least one company and cannot be deleted.'],
            ]);
        }

        $journeyTemplate->delete();
    }
}
