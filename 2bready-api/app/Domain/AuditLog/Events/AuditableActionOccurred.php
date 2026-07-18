<?php

declare(strict_types=1);

namespace App\Domain\AuditLog\Events;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * One generic event for every audited action — both the automatic model
 * mutations fired by the Auditable trait and the hand-fired security events
 * in AuthController (login, logout, 2FA, password reset). A single event
 * type keeps "does this get recorded" answered by one listener
 * (RecordAuditLogListener) instead of a growing list of one-off event/listener
 * pairs that each have to remember to wire themselves up.
 */
class AuditableActionOccurred
{
    use Dispatchable;

    /**
     * @param  array{old: array<string, mixed>|null, new: array<string, mixed>|null}|null  $changes
     * @param  array<string, mixed>|null  $metadata
     */
    public function __construct(
        public readonly string $action,
        public readonly ?string $companyId = null,
        public readonly ?string $auditableType = null,
        public readonly ?string $auditableId = null,
        public readonly ?array $changes = null,
        public readonly ?array $metadata = null,
        // Explicit actor override. Left null for model mutations (the listener
        // resolves auth()->user() itself, correct for any normal authenticated
        // request). Set explicitly for security events where auth()->user()
        // wouldn't be right or available — a failed login has no authenticated
        // user at all, but we still want the attempted email captured.
        public readonly ?string $actorId = null,
        public readonly ?string $actorEmail = null,
    ) {}
}
