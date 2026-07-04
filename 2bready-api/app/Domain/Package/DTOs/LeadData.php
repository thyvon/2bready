<?php

declare(strict_types=1);

namespace App\Domain\Package\DTOs;

use Spatie\LaravelData\Data;

class LeadData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $phone,
        public readonly ?string $company_name,
        public readonly string $source = 'paywall',
    ) {}
}
