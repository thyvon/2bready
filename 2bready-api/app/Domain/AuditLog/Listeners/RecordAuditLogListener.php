<?php

declare(strict_types=1);

namespace App\Domain\AuditLog\Listeners;

use App\Domain\AuditLog\Actions\RecordAuditLogAction;
use App\Domain\AuditLog\DTOs\RecordAuditLogData;
use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\User\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Sync, not queued — an audit trail that can silently fail to write because a
 * queue worker was down is worse than the small latency cost of writing it
 * inline, and this is a single INSERT.
 */
class RecordAuditLogListener
{
    public function __construct(private readonly RecordAuditLogAction $action) {}

    public function handle(AuditableActionOccurred $event): void
    {
        $request = app()->bound('request') ? request() : null;

        /** @var User|null $authUser */
        $authUser = Auth::user();

        $this->action->execute(new RecordAuditLogData(
            action: $event->action,
            companyId: $event->companyId,
            userId: $event->actorId ?? $authUser?->id,
            actorEmail: $event->actorEmail ?? $authUser?->email,
            auditableType: $event->auditableType,
            auditableId: $event->auditableId,
            changes: $event->changes,
            metadata: $event->metadata,
            ipAddress: $request?->ip(),
            userAgent: $request?->userAgent(),
        ));
    }
}
