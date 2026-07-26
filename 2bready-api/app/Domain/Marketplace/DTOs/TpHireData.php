<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\DTOs;

use Spatie\LaravelData\Data;

class TpHireData extends Data
{
    public function __construct(
        public readonly string $company_id,
        public readonly string $tp_partner_id,
        public readonly string $journey_level,
        public readonly string $method,
    ) {}
}
