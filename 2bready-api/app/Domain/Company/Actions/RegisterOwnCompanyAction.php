<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\DTOs\CompanyData;
use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;

/**
 * Self-service company registration, distinct from CreateCompanyAction's
 * admin-on-behalf-of-a-client flow. Links the created company to the
 * registering user directly, rather than leaving that user unattached.
 */
class RegisterOwnCompanyAction
{
    public function __construct(private readonly CreateCompanyAction $createCompanyAction) {}

    public function execute(User $user, CompanyData $data): Company
    {
        $company = $this->createCompanyAction->execute($data);

        $user->update(['company_id' => $company->id]);

        return $company;
    }
}
