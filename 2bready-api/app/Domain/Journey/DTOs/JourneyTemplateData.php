<?php

declare(strict_types=1);

namespace App\Domain\Journey\DTOs;

use Spatie\LaravelData\Data;

class JourneyTemplateData extends Data
{
    public function __construct(
        public readonly string $country_code,
        public readonly string $industry_id,
        public readonly string $name,
        public readonly ?string $name_kh = null,
        public readonly bool $is_active = true,
    ) {}
}
