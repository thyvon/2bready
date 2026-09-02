<?php

declare(strict_types=1);

namespace App\Domain\Package\DTOs;

use Spatie\LaravelData\Data;

class PackageData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $name_kh,
        public readonly ?string $description,
        public readonly int $monthly_price_cents,
        public readonly int $yearly_price_cents,
        public readonly ?string $industry_id = null,
        public readonly ?string $journey_level_id = null,
        public readonly string $tier = 'free',
        public readonly bool $is_active = true,
        public readonly int $sort_order = 0,
    ) {}
}
