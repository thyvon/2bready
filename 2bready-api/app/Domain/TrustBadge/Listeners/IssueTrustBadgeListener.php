<?php

declare(strict_types=1);

namespace App\Domain\TrustBadge\Listeners;

use App\Domain\Audit\Enums\AuditStatus;
use App\Domain\Audit\Events\AuditDecisionMade;
use App\Domain\TrustBadge\Actions\IssueTrustBadgeAction;
use App\Domain\TrustBadge\Jobs\GenerateCertificateJob;

/**
 * The second AuditDecisionMade listener (besides UpdateComplianceScoreListener
 * — Rule #3's score/milestone flow is untouched): issues the trust badge for
 * an approved audit, then dispatches GenerateCertificateJob (queued, never
 * inline) so the certificate PDF/QR is rendered off the request thread
 * (v3 §1.6). AuditDecisionMade fires only on approval (ReviewAuditAction), so
 * the status guard below is defensive, not the primary gate — a rejected
 * audit must never earn a badge even if the event is somehow replayed.
 */
class IssueTrustBadgeListener
{
    public function __construct(private readonly IssueTrustBadgeAction $issueBadge) {}

    public function handle(AuditDecisionMade $event): void
    {
        if ($event->audit->status !== AuditStatus::Approved) {
            return;
        }

        $badge = $this->issueBadge->execute($event->audit, $event->reviewedBy);

        GenerateCertificateJob::dispatch($badge->id);
    }
}
