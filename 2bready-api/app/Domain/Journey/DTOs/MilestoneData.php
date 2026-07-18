<?php

declare(strict_types=1);

namespace App\Domain\Journey\DTOs;

use Spatie\LaravelData\Data;

class MilestoneData extends Data
{
    public function __construct(
        public readonly string $journey_level_id,
        public readonly string $name,
        public readonly int $sort_order = 0,
    ) {}
}
