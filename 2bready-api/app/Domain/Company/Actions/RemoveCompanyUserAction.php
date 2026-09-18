<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Removes a user from a company's team (detaches from the company_user
 * pivot). Blocks removal of the company's last owner to prevent an
 * unrecoverable state.
 */
class RemoveCompanyUserAction
{
    public function execute(Company $company, User $user): void
    {
        if (! $company->users()->where('users.id', $user->id)->exists()) {
            abort(404);
        }

        // Same last-owner guard as UpdateCompanyUserAction — no recovery
        // path exists if the last owner is removed.
        if ($user->hasRole('company_owner')) {
            $anotherOwnerExists = $company->users()
                ->wherePivot('user_id', '!=', $user->id)
                ->whereHas('roles', fn ($q) => $q->where('name', 'company_owner'))
                ->exists();

            if (! $anotherOwnerExists) {
                throw ValidationException::withMessages([
                    'user_id' => ['Cannot remove the last owner of a company.'],
                ]);
            }
        }

        $company->users()->detach($user->id);

        // If this was the user's current company, reset to their next
        // available company or null.
        if ($user->current_company_id === $company->id) {
            $nextCompany = $user->companies()->first();
            $user->update(['current_company_id' => $nextCompany?->id]);
        }

        // Remove company-side roles if the user no longer belongs to any company.
        if ($user->companies()->count() === 0) {
            $user->removeRole(['company_owner', 'company_member']);
        }
    }
}
