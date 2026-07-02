<?php

declare(strict_types=1);

namespace App\Domain\User\DTOs;

use Spatie\LaravelData\Data;

class RegisterUserData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly string $locale = 'en',
    ) {}
}
