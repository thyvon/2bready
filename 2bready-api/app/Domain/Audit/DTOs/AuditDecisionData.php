<?php

declare(strict_types=1);

namespace App\Domain\Audit\DTOs;

use Spatie\LaravelData\Data;

/** Auditor's submitted findings — score (0-100) + free-text feedback. */
class AuditDecisionData extends Data
{
    public function __construct(
        public readonly int $score,
        public readonly ?string $feedback = null,
    ) {}
}
