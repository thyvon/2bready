<?php

declare(strict_types=1);

namespace App\Domain\Audit\Actions;

use App\Domain\Audit\Enums\AuditStatus;
use App\Domain\Audit\Events\AuditDecisionMade;
use App\Domain\Audit\Models\Audit;
use App\Domain\User\Models\User;
use App\Exceptions\AuditNotReviewableException;

/**
 * Admin's final verdict on a submitted audit. Approving fires
 * AuditDecisionMade (which ComplianceScoreService picks up to recalculate the
 * company's compliance score and complete the level's milestones); rejecting
 * records the negative outcome with no score side effects.
 */
class ReviewAuditAction
{
    public function execute(Audit $audit, bool $approved, User $reviewedBy): Audit
    {
        if ($audit->status !== AuditStatus::Submitted) {
            throw new AuditNotReviewableException;
        }

        $audit->update([
            'status' => $approved ? AuditStatus::Approved : AuditStatus::Rejected,
            'reviewed_at' => now(),
        ]);

        if ($approved) {
            event(new AuditDecisionMade($audit, $reviewedBy));
        }

        return $audit;
    }
}
