<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\DTOs\CompanyData;
use App\Domain\Company\Models\Company;
use App\Domain\Company\Services\CompanyBypassEvaluator;

class CreateCompanyAction
{
    public function __construct(private readonly CompanyBypassEvaluator $bypassEvaluator) {}

    public function execute(CompanyData $data): Company
    {
        return Company::create([
            'name' => $data->name,
            'name_kh' => $data->name_kh,
            'registration_no' => $data->registration_no,
            'employee_count' => $data->employee_count,
            'bypass_flags' => $this->bypassEvaluator->evaluate($data->employee_count),
            'industry_code' => $data->industry_code,
            'country_code' => $data->country_code,
            'default_locale' => $data->default_locale,
        ]);
    }
}
