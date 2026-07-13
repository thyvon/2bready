<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\DTOs\CompanyData;
use App\Domain\Company\Models\Company;
use App\Domain\Company\Services\CompanyBypassEvaluator;
use App\Domain\Journey\Actions\ActivateJourneyAction;

class CreateCompanyAction
{
    public function __construct(
        private readonly CompanyBypassEvaluator $bypassEvaluator,
        private readonly ActivateJourneyAction $activateJourneyAction,
    ) {}

    public function execute(CompanyData $data): Company
    {
        $company = Company::create([
            'name' => $data->name,
            'name_kh' => $data->name_kh,
            'registration_no' => $data->registration_no,
            'employee_count' => $data->employee_count,
            'bypass_flags' => $this->bypassEvaluator->evaluate($data->employee_count),
            'industry_id' => $data->industry_id,
            'country_code' => $data->country_code,
            'default_locale' => $data->default_locale,
        ]);

        // No matching JourneyTemplate for this country/industry pair yet (only
        // Cambodia F&B exists at MVP) is not an error — ActivateJourneyAction
        // returns null and the company just has no journey until one exists.
        $this->activateJourneyAction->execute($company);

        return $company;
    }
}
