<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use Illuminate\Validation\ValidationException;

class UpdateCompanyUserAction
{
    /** @param array<string, mixed> $data */
    public function execute(Company $company, User $user, array $data): User
    {
        if (array_key_exists('role', $data)) {
            $newRole = $data['role'];

            // No self-service recovery path exists for "this company has no
            // owner" — every owner-only action in client-portal (inviting/
            // removing members, subscribing, editing the company) would become
            // unreachable by anyone until 2bReady staff intervened by hand.
            // Only blocks the specific transition that would cause it: demoting
            // this company's only remaining owner.
            if ($newRole === 'company_member' && $user->hasRole('company_owner')) {
                $anotherOwnerExists = $company->users()
                    ->wherePivot('user_id', '!=', $user->id)
                    ->whereHas('roles', fn ($q) => $q->where('name', 'company_owner'))
                    ->exists();

                if (! $anotherOwnerExists) {
                    throw ValidationException::withMessages([
                        'role' => ['This company must always have at least one owner.'],
                    ]);
                }
            }

            // Scoped sync, same reasoning as UpdateUserAction (internal users):
            // preserve any role outside the company-role set instead of a full
            // replace, even though a company-side user holding some other role
            // isn't a case that should normally happen.
            $preservedRoles = $user->roles()->whereNotIn('name', ['company_owner', 'company_member'])->pluck('name')->all();
            $user->syncRoles([$newRole, ...$preservedRoles]);
        }

        if (array_key_exists('status', $data)) {
            $user->update(['status' => $data['status']]);
        }

        return $user;
    }
}
