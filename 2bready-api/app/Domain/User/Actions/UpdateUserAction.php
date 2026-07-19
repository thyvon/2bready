<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
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

        // Named events alongside the generic user.updated entry the Auditable
        // trait already fires on $user->update() below — these two fields are
        // security-relevant enough to deserve their own legible label in an
        // audit-log view rather than being buried in a raw before/after diff.
        if (array_key_exists('google_auth_enabled', $data) && $data['google_auth_enabled'] !== $user->google_auth_enabled) {
            event(new AuditableActionOccurred(
                action: 'user.google_auth_toggled',
                auditableType: 'user',
                auditableId: $user->id,
                metadata: ['enabled' => $data['google_auth_enabled']],
            ));
        }

        if (array_key_exists('two_factor_required', $data) && $data['two_factor_required'] !== $user->two_factor_required) {
            event(new AuditableActionOccurred(
                action: 'user.two_factor_requirement_changed',
                auditableType: 'user',
                auditableId: $user->id,
                metadata: ['two_factor_required' => $data['two_factor_required']],
            ));
        }

        $user->update($data);

        return $user;
    }
}
