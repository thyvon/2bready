<?php

declare(strict_types=1);

namespace App\Domain\Journey\DTOs;

use Spatie\LaravelData\Data;

class JourneyLevelData extends Data
{
    public function __construct(
        public readonly string $journey_template_id,
        public readonly string $code,
        public readonly string $name,
        public readonly string $pathway_name,
        public readonly string $pillar,
        public readonly int $sort_order = 0,
    ) {}
}
