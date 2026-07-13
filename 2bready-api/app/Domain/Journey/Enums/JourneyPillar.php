<?php

declare(strict_types=1);

namespace App\Domain\Journey\Enums;

// Mirrors client-portal's Pillar['id'] (journey-data.ts) exactly — Comply/Scale/Lead
// groups levels for presentation and (eventually) package-tier gating, mined from
// the project owner's signed-off taxonomy, not invented here.
enum JourneyPillar: string
{
    case Comply = 'comply';
    case Scale = 'scale';
    case Lead = 'lead';
}
