<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\User\Models\User;

class UpdateUserAction
{
    /** @param array<string, mixed> $data */
    public function execute(User $user, array $data): User
    {
        if (array_key_exists('roles', $data)) {
            // Scoped sync, not a full syncRoles($data['roles']) replace. A real
            // production account (vunthypro@gmail.com) holds both an internal
            // role and company_owner simultaneously — this form only ever shows
            // and submits User::INTERNAL_ROLES checkboxes, so a full replace
            // would silently strip company_owner (or any other role outside
            // that set) on every single edit, even one that only changed the
            // name. Any non-internal role the account already holds is
            // preserved untouched.
            $preservedRoles = $user->roles()->whereNotIn('name', User::INTERNAL_ROLES)->pluck('name')->all();
            $user->syncRoles([...$data['roles'], ...$preservedRoles]);
            unset($data['roles']);
        }

        $user->update($data);

        return $user;
    }
}
