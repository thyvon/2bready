<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Enums\JourneyStatus;
use App\Domain\Journey\Exceptions\JourneyTemplateNotFoundException;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyTemplate;

/**
 * Activates a company's journey by matching (country_code, industry_id) to an
 * active JourneyTemplate. Idempotent — returns existing Journey if already
 * activated.
 */
class ActivateJourneyAction
{
    public function execute(Company $company): Journey
    {
        $existing = Journey::query()
            ->where('company_id', $company->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        $template = JourneyTemplate::query()
            ->where('country_code', $company->country_code)
            ->where('industry_id', $company->industry_id)
            ->where('is_active', true)
            ->first();

        if (! $template) {
            throw new JourneyTemplateNotFoundException(
                $company->country_code,
                (string) $company->industry_id,
            );
        }

        return Journey::create([
            'company_id' => $company->id,
            'journey_template_id' => $template->id,
            'status' => JourneyStatus::Active,
            'activated_at' => now(),
        ]);
    }
}
