<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Audit\Events\AuditDecisionMade;
use App\Domain\Notification\Notifications\AuditApprovedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifies a company's users when their audit is approved.
 * Cross-domain: event lives in Audit, listener in Notification.
 * Attaches to the same AuditDecisionMade event as
 * UpdateComplianceScoreListener and IssueTrustBadgeListener —
 * all three run independently.
 */
class SendAuditApprovedNotification implements ShouldQueue
{
    public function handle(AuditDecisionMade $event): void
    {
        $audit = $event->audit->loadMissing(['company.users']);

        $company = $audit->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $user->notify(AuditApprovedNotification::forAudit($audit, $event->reviewedBy));
        }
    }
}
