<?php

declare(strict_types=1);

namespace App\Domain\Audit\Actions;

use App\Domain\Audit\Enums\AuditStatus;
use App\Domain\Audit\Models\Audit;
use App\Domain\TpPartner\Models\Auditor;
use App\Exceptions\AuditNotAssignableException;
use App\Exceptions\AuditorNotFromHiredFirmException;

/**
 * Admin assigns an individual Auditor (from the hired firm) to a pending
 * audit. The auditor must belong to the firm that was hired for this audit —
 * a firm hired for L2 only must never get assigned an L3/L4 review, and a
 * firm with no engagement at all must never be handed a review either.
 * Assigning moves the audit from pending to in_progress.
 */
class AssignAuditorAction
{
    public function execute(Audit $audit, string $auditorId): Audit
    {
        if ($audit->status !== AuditStatus::Pending) {
            throw new AuditNotAssignableException;
        }

        $auditor = Auditor::query()->findOrFail($auditorId);

        // The audit's firm is resolved through its hire (hasOneThrough) —
        // the one engagement this review is actually paid under.
        if ($auditor->tp_partner_id !== $audit->tpHire->tp_partner_id) {
            throw new AuditorNotFromHiredFirmException;
        }

        $audit->update([
            'auditor_id' => $auditor->id,
            'status' => AuditStatus::InProgress,
            'assigned_at' => now(),
        ]);

        return $audit;
    }
}
