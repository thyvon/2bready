<?php

declare(strict_types=1);

namespace App\Domain\Audit\Actions;

use App\Domain\Audit\DTOs\AuditDecisionData;
use App\Domain\Audit\Enums\AuditStatus;
use App\Domain\Audit\Models\Audit;
use App\Exceptions\AuditNotSubmittableException;

/**
 * The assigned auditor submits their findings (score 0-100 + feedback),
 * moving the audit to submitted. The submitted score is a recommendation —
 * the authoritative score is recalculated from evidence at approval by
 * ComplianceScoreService.
 */
class SubmitAuditAction
{
    public function execute(Audit $audit, AuditDecisionData $data): Audit
    {
        if ($audit->status !== AuditStatus::InProgress || $audit->auditor_id === null) {
            throw new AuditNotSubmittableException;
        }

        $audit->update([
            'status' => AuditStatus::Submitted,
            'score' => $data->score,
            'feedback' => $data->feedback,
            'submitted_at' => now(),
        ]);

        return $audit;
    }
}
