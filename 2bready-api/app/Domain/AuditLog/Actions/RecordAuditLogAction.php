<?php

declare(strict_types=1);

namespace App\Domain\AuditLog\Actions;

use App\Domain\AuditLog\DTOs\RecordAuditLogData;
use App\Domain\AuditLog\Models\AuditLog;

/**
 * The only place that ever writes an AuditLog row — called exclusively by
 * RecordAuditLogListener. Never call this (or AuditLog::create()) directly
 * from a controller/other action; fire an event instead, so "was this
 * recorded" never depends on every call site remembering to do it inline.
 */
class RecordAuditLogAction
{
    public function execute(RecordAuditLogData $data): AuditLog
    {
        return AuditLog::create([
            'company_id' => $data->companyId,
            'user_id' => $data->userId,
            'actor_email' => $data->actorEmail,
            'action' => $data->action,
            'auditable_type' => $data->auditableType,
            'auditable_id' => $data->auditableId,
            'changes' => $data->changes,
            'metadata' => $data->metadata,
            'ip_address' => $data->ipAddress,
            'user_agent' => $data->userAgent,
        ]);
    }
}
