<?php

declare(strict_types=1);

namespace App\Domain\Company\DTOs;

use Spatie\LaravelData\Data;

class CompanyData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $name_kh,
        public readonly ?string $registration_no,
        public readonly ?int $employee_count,
        public readonly string $industry_code,
        public readonly string $country_code = 'KH',
        public readonly string $default_locale = 'en',
    ) {}
}
