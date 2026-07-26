<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\User\DTOs\UpdateOwnProfileData;
use App\Domain\User\Models\User;

class UpdateOwnProfileAction
{
    public function execute(User $user, UpdateOwnProfileData $data): User
    {
        $emailChanged = $data->email !== $user->email;

        $user->update([
            'name' => $data->name,
            'email' => $data->email,
            // A changed email is unproven until re-verified — same standard
            // any new account is held to (RegisterUserAction). Internal/TP
            // accounts stamp this at creation time, but a subsequent change
            // to that same address is not automatically re-trusted.
            'email_verified_at' => $emailChanged ? null : $user->email_verified_at,
        ]);

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return $user;
    }
}
