<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\User\Exceptions\GoogleAuthRejectedException;
use App\Domain\User\Models\User;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class HandleGoogleCallbackAction
{
    /**
     * Resolves (or, client-portal only, creates) the local account for a
     * Google sign-in. Deliberately asymmetric between portals: admin-portal
     * never auto-creates an internal (admin/staff/finance/auditor) account
     * from an unsolicited callback — there's no safe default role for a
     * brand-new admin, so that would be a real privilege-escalation hole.
     * Client-portal may auto-create (assigns company_owner, same as
     * self-registration), since that's the existing self-service path anyway.
     *
     * @throws GoogleAuthRejectedException
     */
    public function execute(SocialiteUser $googleUser, string $portal): User
    {
        $requiredPermission = $portal === 'admin' ? 'portal.admin.access' : 'portal.client.access';

        $user = User::query()->where('google_id', $googleUser->getId())->first()
            ?? User::query()->where('email', $googleUser->getEmail())->first();

        if (! $user) {
            if ($portal === 'admin') {
                throw new GoogleAuthRejectedException('No admin account exists for this Google email.');
            }

            $user = User::create([
                'name' => $googleUser->getName() ?: $googleUser->getEmail(),
                'email' => $googleUser->getEmail(),
                'password' => str()->random(40),
                'google_id' => $googleUser->getId(),
                'google_auth_enabled' => true,
                // Google already verified this address — no separate verification
                // email needed for an account created this way.
                'email_verified_at' => now(),
            ]);
            $user->assignRole('company_owner');

            event(new AuditableActionOccurred(action: 'auth.google_account_created', actorId: $user->id, actorEmail: $user->email));

            return $user;
        }

        if (! $user->isActive()) {
            throw new GoogleAuthRejectedException('Your account has been suspended.');
        }

        if (! $user->can($requiredPermission)) {
            throw new GoogleAuthRejectedException('This Google account cannot sign in here.');
        }

        if (! $user->google_auth_enabled) {
            throw new GoogleAuthRejectedException("Google sign-in isn't enabled for this account. Contact your admin.");
        }

        if (! $user->google_id) {
            $user->update(['google_id' => $googleUser->getId()]);
        }

        return $user;
    }
}
