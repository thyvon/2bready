<?php

declare(strict_types=1);

namespace App\Domain\Package\Enums;

// Mirrors client-portal's Tier (journey-data.ts) exactly — this is the real
// source of truth the frontend's LEVEL_META lookup used to hardcode locally.
enum Tier: string
{
    case Free = 'free';
    case Starter = 'starter';
    case Pro = 'pro';
    case Enterprise = 'enterprise';
}
