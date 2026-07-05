<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;

/**
 * Changes which of a user's own companies is "active" — the one every
 * tenant-scoped query resolves against (BelongsToCompany::resolveCurrentCompanyId).
 * The controller authorizes via CompanyPolicy::switchTo before this runs, but
 * membership is re-checked here too: this must never update current_company_id
 * to a company the user doesn't actually belong to.
 */
class SwitchActiveCompanyAction
{
    public function execute(User $user, Company $company): User
    {
        abort_unless(
            $user->companies()->where('companies.id', $company->id)->exists(),
            403,
            'You do not belong to that company.',
        );

        $user->update(['current_company_id' => $company->id]);

        return $user;
    }
}
