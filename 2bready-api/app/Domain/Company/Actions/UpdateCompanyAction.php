<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Company\Services\CompanyBypassEvaluator;

class UpdateCompanyAction
{
    public function __construct(private readonly CompanyBypassEvaluator $bypassEvaluator) {}

    /** @param array<string, mixed> $data */
    public function execute(Company $company, array $data): Company
    {
        if (array_key_exists('employee_count', $data)) {
            $data['bypass_flags'] = $this->bypassEvaluator->evaluate($data['employee_count']);
        }

        $company->update($data);

        return $company;
    }
}
