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
        public readonly int $price_cents,
        public readonly string $billing_period = 'monthly',
        public readonly bool $is_active = true,
        public readonly int $sort_order = 0,
    ) {}
}
