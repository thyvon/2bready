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
            $user->syncRoles($data['roles']);
            unset($data['roles']);
        }

        $user->update($data);

        return $user;
    }
}
