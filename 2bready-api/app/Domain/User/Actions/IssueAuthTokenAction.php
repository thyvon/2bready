<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\User\Models\User;
use App\Http\Resources\Api\V1\UserResource;

/**
 * Extracted from AuthController so password login, Google sign-in
 * (HandleGoogleCallbackAction), and any future login method all funnel
 * through the exact same 2FA gate — 2FA enforcement must never depend on
 * which credential the user proved their identity with.
 */
class IssueAuthTokenAction
{
    /** @return array{user: UserResource, token: string, totp_required: bool, totp_confirmed?: bool} */
    public function execute(User $user): array
    {
        // If 2FA is required but not confirmed, prompt for setup. This token is
        // deliberately scoped to the 'totp-pending' ability only (not the default '*') so
        // it can reach the auth/totp/* + logout endpoints but nothing else — enforced by
        // the EnsureTwoFactorVerified middleware on every other protected route. A
        // credential alone must never be enough to reach business data when the
        // account requires 2FA.
        if ($user->requiresTwoFactor() && ! $user->hasTwoFactorEnabled()) {
            $token = $user->createToken('api-pending-totp', ['totp-pending'])->plainTextToken;

            return [
                'user' => new UserResource($user),
                'token' => $token,
                'totp_required' => true,
                'totp_confirmed' => false,
            ];
        }

        // If 2FA is set up, require the code before issuing a fully-capable token.
        if ($user->hasTwoFactorEnabled()) {
            $token = $user->createToken('api-pending-totp', ['totp-pending'])->plainTextToken;

            return [
                'user' => new UserResource($user),
                'token' => $token,
                'totp_required' => true,
                'totp_confirmed' => true,
            ];
        }

        $token = $user->createToken('api')->plainTextToken;

        // Only reached here (not the two totp_required branches above) — for a
        // 2FA account, "login" isn't complete until totpConfirm/totpVerify
        // upgrades the pending token, so that's where those dispatch it instead.
        event(new AuditableActionOccurred(action: 'auth.login', actorId: $user->id, actorEmail: $user->email));

        return [
            'user' => new UserResource($user),
            'token' => $token,
            'totp_required' => false,
        ];
    }
}
