<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Assigns an existing user to a company's team as company_owner or
 * company_member. Unlike AddCompanyUserAction (which creates a brand-new
 * user), this attaches a pre-existing user account to the pivot.
 */
class AssignCompanyUserAction
{
    public function execute(Company $company, User $user, string $role): User
    {
        if ($company->users()->where('users.id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'user_id' => ['This user is already a member of this company.'],
            ]);
        }

        $user->companies()->attach($company->id);
        $user->syncRoles($role);
        $user->update(['current_company_id' => $company->id]);

        return $user->load(['roles', 'companies']);
    }
}
