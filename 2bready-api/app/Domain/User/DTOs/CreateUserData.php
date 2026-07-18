<?php

declare(strict_types=1);

namespace App\Domain\User\DTOs;

use Spatie\LaravelData\Data;

class CreateUserData extends Data
{
    /** @param string[] $roles */
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly array $roles,
    ) {}
}
