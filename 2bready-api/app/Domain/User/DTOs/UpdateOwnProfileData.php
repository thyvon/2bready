<?php

declare(strict_types=1);

namespace App\Domain\User\DTOs;

use Spatie\LaravelData\Data;

class UpdateOwnProfileData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
    ) {}
}
