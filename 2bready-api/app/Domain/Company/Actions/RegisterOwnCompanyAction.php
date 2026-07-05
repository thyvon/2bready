<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\DTOs\CompanyData;
use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;

/**
 * Self-service company registration, distinct from CreateCompanyAction's
 * admin-on-behalf-of-a-client flow. Adds a company_user membership for the
 * registering user and makes the new company their active one — a
 * company_owner can call this any number of times (§0.7 of the MVP
 * proposal), each call adding another company rather than replacing one.
 */
class RegisterOwnCompanyAction
{
    public function __construct(private readonly CreateCompanyAction $createCompanyAction) {}

    public function execute(User $user, CompanyData $data): Company
    {
        $company = $this->createCompanyAction->execute($data);

        $user->companies()->attach($company->id);
        $user->update(['current_company_id' => $company->id]);

        return $company;
    }
}
