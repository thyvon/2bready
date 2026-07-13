<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Enums\JourneyStatus;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyTemplate;

/**
 * Fired when a company is created — matches its (country_code, industry_id)
 * against a JourneyTemplate and instantiates the company's Journey. No
 * package-tier gating yet ("journey activation by plan" per the proposal) —
 * Package doesn't have a tier column to gate against yet, so every company
 * gets its full matching journey unconditionally for now.
 */
class ActivateJourneyAction
{
    public function execute(Company $company): ?Journey
    {
        $template = JourneyTemplate::query()
            ->where('country_code', $company->country_code)
            ->where('industry_id', $company->industry_id)
            ->where('is_active', true)
            ->first();

        if (! $template) {
            return null;
        }

        return Journey::create([
            'company_id' => $company->id,
            'journey_template_id' => $template->id,
            'status' => JourneyStatus::Active,
            'activated_at' => now(),
        ]);
    }
}
