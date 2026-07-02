<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\User\Models\User;
use PragmaRX\Google2FA\Google2FA;

class ConfirmTotpAction
{
    public function __construct(private readonly Google2FA $google2fa) {}

    public function execute(User $user, string $code): bool
    {
        $secret = decrypt($user->two_factor_secret);

        $valid = $this->google2fa->verifyKey($secret, $code);

        if ($valid) {
            $user->update(['two_factor_confirmed_at' => now()]);
        }

        return $valid;
    }
}
