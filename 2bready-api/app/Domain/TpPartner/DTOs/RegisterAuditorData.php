<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\DTOs;

use Spatie\LaravelData\Data;

class RegisterAuditorData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
    ) {}
}
