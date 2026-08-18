<?php

declare(strict_types=1);

namespace App\Domain\LegalConsent\Enums;

/**
 * The restricted document tiers this consent gates (v3 §5.1). Mirrors the
 * blueprint's P3/P4 restricted pathways and the ERD CHECK constraint.
 * Journey-level L3 → P3, L4 → P4 (see LegalConsentService::pathwayForLevel).
 */
enum PathwayLevel: string
{
    case P3 = 'P3';
    case P4 = 'P4';

    /** @return array<int, self> all values, for the CHECK constraint mirror */
    public static function values(): array
    {
        return [self::P3, self::P4];
    }
}
