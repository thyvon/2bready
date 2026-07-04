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

        $qrCode = $this->google2fa->getQRCodeInline(
            config('app.name'),
            $user->email,
            $secret,
        );

        // google2fa-qrcode only wraps its output as a data: URI when the imagick PHP
        // extension is loaded (PNG path) — without it, it silently falls back to raw SVG
        // XML text, which is useless as an <img src>. Normalize both cases ourselves so
        // this doesn't depend on which extensions happen to be installed in a given
        // environment (imagick isn't installed in the production image).
        $qrCodeUrl = str_starts_with($qrCode, 'data:')
            ? $qrCode
            : 'data:image/svg+xml;base64,'.base64_encode($qrCode);

        return [
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ];
    }
}
