<?php

declare(strict_types=1);

namespace App\Domain\User\Actions;

use App\Domain\User\Models\User;
use PragmaRX\Google2FAQRCode\Google2FA;

class SetupTotpAction
{
    public function __construct(private readonly Google2FA $google2fa) {}

    /** @return array{secret: string, qr_code_url: string} */
    public function execute(User $user): array
    {
        $secret = $this->google2fa->generateSecretKey();

        $user->update(['two_factor_secret' => encrypt($secret)]);

        $qrCodeUrl = $this->google2fa->getQRCodeInline(
            config('app.name'),
            $user->email,
            $secret,
        );

        return [
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ];
    }
}
