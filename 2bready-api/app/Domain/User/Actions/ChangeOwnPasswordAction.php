<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\User\Models\User;
use Illuminate\Support\Facades\Hash;

class ChangeOwnPasswordAction
{
    public function execute(User $user, string $currentPassword, string $newPassword): bool
    {
        if (! Hash::check($currentPassword, $user->password)) {
            return false;
        }

        $user->forceFill(['password' => $newPassword])->save();

        // Revoke every other session — same reasoning as the forgot/reset-
        // password flow (AuthController::resetPassword): a password change
        // should invalidate tokens issued under the old one.
        $user->tokens()->delete();

        event(new AuditableActionOccurred(
            action: 'auth.password_changed',
            actorId: $user->id,
            actorEmail: $user->email,
        ));

        return true;
    }
}
