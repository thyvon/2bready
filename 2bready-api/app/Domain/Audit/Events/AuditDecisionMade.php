<?php

declare(strict_types=1);

namespace App\Domain\Audit\Events;

use App\Domain\Audit\Models\Audit;
use App\Domain\User\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired once an audit is approved (never on rejection). The single trigger
 * for the audit's downstream effects — ComplianceScoreService recalculates
 * the company's compliance score and completes the audited level's
 * milestones with the AuditApproval trigger. Kept explicit about the
 * reviewedBy actor so the audit log and any future certificate/badge
 * issuance share the same authoritative reviewer.
 */
class AuditDecisionMade
{
    use Dispatchable;

    public function __construct(
        public readonly Audit $audit,
        public readonly User $reviewedBy,
    ) {}
}
