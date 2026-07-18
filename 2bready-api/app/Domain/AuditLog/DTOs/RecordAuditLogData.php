<?php

declare(strict_types=1);

namespace App\Domain\AuditLog\DTOs;

use Spatie\LaravelData\Data;

class RecordAuditLogData extends Data
{
    /**
     * @param  array<string, mixed>|null  $changes
     * @param  array<string, mixed>|null  $metadata
     */
    public function __construct(
        public readonly string $action,
        public readonly ?string $companyId,
        public readonly ?string $userId,
        public readonly ?string $actorEmail,
        public readonly ?string $auditableType,
        public readonly ?string $auditableId,
        public readonly ?array $changes,
        public readonly ?array $metadata,
        public readonly ?string $ipAddress,
        public readonly ?string $userAgent,
    ) {}
}
