<?php

declare(strict_types=1);

namespace App\Domain\Industry\DTOs;

use Spatie\LaravelData\Data;

class IndustryData extends Data
{
    public function __construct(
        public readonly string $code,
        public readonly string $name,
        public readonly ?string $name_kh,
        public readonly ?string $description,
        public readonly bool $is_active = true,
        public readonly int $sort_order = 0,
    ) {}
}
