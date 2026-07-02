<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\User\Models\User;
use PragmaRX\Google2FA\Google2FA;

class VerifyTotpAction
{
    public function __construct(private readonly Google2FA $google2fa) {}

    public function execute(User $user, string $code): bool
    {
        if (! $user->hasTwoFactorEnabled()) {
            return false;
        }

        $secret = decrypt($user->two_factor_secret);

        return (bool) $this->google2fa->verifyKey($secret, $code);
    }
}
