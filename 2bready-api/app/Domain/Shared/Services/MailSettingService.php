<?php

declare(strict_types=1);

namespace App\Domain\Shared\Services;

use App\Domain\User\Models\User;
use Illuminate\Support\Facades\Crypt;

/**
 * Same encrypted-at-rest, DB-backed pattern as GoogleOAuthSettingService,
 * applied to SMTP mail config. Lets an admin configure real mail delivery
 * from the Settings UI instead of a redeploy — production currently has no
 * MAIL_* config anywhere, so mail.default silently resolves to Laravel's
 * "log" driver and nothing is actually delivered.
 */
class MailSettingService
{
    private const KEY_HOST = 'mail.smtp.host';

    private const KEY_PORT = 'mail.smtp.port';

    private const KEY_USERNAME = 'mail.smtp.username';

    private const KEY_PASSWORD = 'mail.smtp.password';

    private const KEY_ENCRYPTION = 'mail.smtp.encryption';

    private const KEY_FROM_ADDRESS = 'mail.smtp.from_address';

    private const KEY_FROM_NAME = 'mail.smtp.from_name';

    public function __construct(private readonly PlatformSettingService $settings) {}

    public function host(): ?string
    {
        return $this->settings->get(self::KEY_HOST);
    }

    public function port(): ?int
    {
        $port = $this->settings->get(self::KEY_PORT);

        return $port !== null ? (int) $port : null;
    }

    public function username(): ?string
    {
        // Stored as '' rather than null (see save()) — the platform_settings
        // table's value column is NOT NULL, and Eloquent's json cast passes
        // an actual null straight through to SQL instead of encoding it.
        return $this->settings->get(self::KEY_USERNAME) ?: null;
    }

    public function encryption(): ?string
    {
        return $this->settings->get(self::KEY_ENCRYPTION) ?: null;
    }

    public function fromAddress(): ?string
    {
        return $this->settings->get(self::KEY_FROM_ADDRESS);
    }

    public function fromName(): ?string
    {
        return $this->settings->get(self::KEY_FROM_NAME);
    }

    public function password(): ?string
    {
        $encrypted = $this->settings->get(self::KEY_PASSWORD);

        return $encrypted ? Crypt::decryptString($encrypted) : null;
    }

    public function hasPassword(): bool
    {
        return (bool) $this->settings->get(self::KEY_PASSWORD);
    }

    public function isConfigured(): bool
    {
        return (bool) $this->host() && (bool) $this->fromAddress();
    }

    /**
     * @param  string|null  $password  null/empty keeps the existing stored password
     *                                 (same convention as GoogleOAuthSettingService::save()'s client_secret).
     */
    public function save(
        string $host,
        int $port,
        ?string $username,
        ?string $password,
        ?string $encryption,
        string $fromAddress,
        string $fromName,
        User $updatedBy,
    ): void {
        $this->settings->set(self::KEY_HOST, $host, 'mail', $updatedBy);
        $this->settings->set(self::KEY_PORT, $port, 'mail', $updatedBy);
        // '' not null — see username()'s docblock.
        $this->settings->set(self::KEY_USERNAME, $username ?? '', 'mail', $updatedBy);
        $this->settings->set(self::KEY_ENCRYPTION, $encryption ?? '', 'mail', $updatedBy);
        $this->settings->set(self::KEY_FROM_ADDRESS, $fromAddress, 'mail', $updatedBy);
        $this->settings->set(self::KEY_FROM_NAME, $fromName, 'mail', $updatedBy);

        if ($password !== null && $password !== '') {
            $this->settings->set(self::KEY_PASSWORD, Crypt::encryptString($password), 'mail', $updatedBy);
        }
    }

    /**
     * Overrides Laravel's static .env-based mail config with these DB-backed
     * settings when a host has been saved. Called once from
     * AppServiceProvider::boot() so every mail send in the process picks it
     * up. A no-op until an admin actually saves one, so local dev's Mailpit
     * setup and any .env-based MAIL_* config keep working unchanged.
     */
    public function applyRuntimeConfig(): void
    {
        if (! $this->isConfigured()) {
            return;
        }

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => $this->host(),
            'mail.mailers.smtp.port' => $this->port(),
            'mail.mailers.smtp.username' => $this->username(),
            'mail.mailers.smtp.password' => $this->password(),
            // Symfony Mailer negotiates STARTTLS opportunistically on the
            // default scheme, so "tls" needs no override; only implicit
            // TLS/SSL (typically port 465) needs the "smtps" scheme.
            'mail.mailers.smtp.scheme' => $this->encryption() === 'ssl' ? 'smtps' : null,
            'mail.from.address' => $this->fromAddress(),
            'mail.from.name' => $this->fromName(),
        ]);
    }
}
