<?php

declare(strict_types=1);

namespace App\Domain\LegalConsent\Services;

use App\Domain\LegalConsent\Enums\PathwayLevel;
use App\Domain\Shared\Services\PlatformSettingService;

/**
 * Versioned consent text lives in platform_settings (v3 §0.5 rule: the
 * blueprint's hardcoded consent string is a seed default, not a requirement —
 * an admin can reword it without a redeploy, and the version bump is what
 * keeps old consents valid evidence). This service is the single reader, so
 * the version the client displays always matches the version the record
 * stamps.
 */
class LegalConsentService
{
    public function __construct(private readonly PlatformSettingService $settings) {}

    /** The current consent text version, e.g. "v1" — bumped when the text changes. */
    public function currentVersion(): string
    {
        return (string) $this->settings->get('legal_consent_version', 'v1');
    }

    /** Bilingual consent text — the en is the legally operative copy; kh mirrors it. */
    public function textEn(): string
    {
        return (string) $this->settings->get(
            'legal_consent_text_en',
            'I agree to the Terms of Use — I confirm authorization and will use this document for legitimate business purposes. It contains confidential information.',
        );
    }

    public function textKh(): string
    {
        return (string) $this->settings->get('legal_consent_text_kh', $this->textEn());
    }

    /**
     * Map a journey level code to its restricted pathway. Only L3/L4 are
     * restricted (blueprint: isRestrictedPathway = p3 || p4); anything else
     * returns null so callers can skip the consent gate entirely.
     */
    public function pathwayForLevel(string $levelCode): ?PathwayLevel
    {
        return match ($levelCode) {
            'L3' => PathwayLevel::P3,
            'L4' => PathwayLevel::P4,
            default => null,
        };
    }
}
