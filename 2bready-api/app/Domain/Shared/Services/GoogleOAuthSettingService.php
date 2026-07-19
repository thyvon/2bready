<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services;

use App\Domain\User\Models\User;
use Illuminate\Support\Facades\Crypt;

/**
 * Thin wrapper around PlatformSettingService for Google OAuth config —
 * deliberately not the fully-generic PlatformSettingController, since the
 * client secret needs encryption-at-rest and must never round-trip back to
 * the frontend in plaintext (see GoogleOAuthSettingController).
 *
 * Storing OAuth credentials in the DB rather than .env is a deliberate,
 * scoped exception to this app's usual "secrets in .env only" rule, made so
 * the integration can be configured/rotated from the admin Settings UI
 * without a server redeploy.
 */
class GoogleOAuthSettingService
{
    private const KEY_ENABLED = 'google_oauth.enabled';

    private const KEY_CLIENT_ID = 'google_oauth.client_id';

    private const KEY_CLIENT_SECRET = 'google_oauth.client_secret';

    public function __construct(private readonly PlatformSettingService $settings) {}

    public function isEnabled(): bool
    {
        return (bool) $this->settings->get(self::KEY_ENABLED, false);
    }

    public function clientId(): ?string
    {
        return $this->settings->get(self::KEY_CLIENT_ID);
    }

    public function clientSecret(): ?string
    {
        $encrypted = $this->settings->get(self::KEY_CLIENT_SECRET);

        return $encrypted ? Crypt::decryptString($encrypted) : null;
    }

    public function hasClientSecret(): bool
    {
        return (bool) $this->settings->get(self::KEY_CLIENT_SECRET);
    }

    public function isFullyConfigured(): bool
    {
        return $this->isEnabled() && (bool) $this->clientId() && $this->hasClientSecret();
    }

    /**
     * $clientSecret is nullable — omitted (or empty) means "keep the existing
     * secret," so the frontend never needs to resend a value it was never
     * shown in the first place.
     */
    public function save(bool $enabled, string $clientId, ?string $clientSecret, User $updatedBy): void
    {
        $this->settings->set(self::KEY_ENABLED, $enabled, 'auth', $updatedBy);
        $this->settings->set(self::KEY_CLIENT_ID, $clientId, 'auth', $updatedBy);

        if ($clientSecret !== null && $clientSecret !== '') {
            $this->settings->set(self::KEY_CLIENT_SECRET, Crypt::encryptString($clientSecret), 'auth', $updatedBy);
        }
    }
}
