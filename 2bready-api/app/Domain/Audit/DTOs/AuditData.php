<?php

declare(strict_types=1);

namespace App\Domain\Audit\DTOs;

use Spatie\LaravelData\Data;

/** Payload for creating an audit against an existing TpHire. */
class AuditData extends Data
{
    public function __construct(
        public readonly string $tp_hire_id,
        public readonly ?string $deadline = null,
    ) {}
}
