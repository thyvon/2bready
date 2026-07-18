<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\User\DTOs\CreateUserData;
use App\Domain\User\Enums\UserStatus;
use App\Domain\User\Models\User;

/**
 * admin-portal's own user-creation path — distinct from RegisterUserAction
 * (client-portal's self-service company_owner signup). There is no
 * self-registration for admin/staff/finance/auditor accounts, so this is
 * currently the only way one gets created.
 */
class CreateInternalUserAction
{
    public function execute(CreateUserData $data): User
    {
        $user = User::create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password,
            'status' => UserStatus::Active,
            // Pre-verified — an internal account created by an admin who already
            // knows this is a real address, not a self-registration that needs the
            // usual ownership-of-inbox proof.
            'email_verified_at' => now(),
        ]);

        $user->syncRoles($data->roles);

        return $user;
    }
}
