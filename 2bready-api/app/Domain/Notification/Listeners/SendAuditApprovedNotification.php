<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Audit\Events\AuditDecisionMade;
use App\Domain\Notification\Enums\NotificationType;
use App\Domain\Notification\Notifications\AuditApprovedNotification;
use App\Domain\Notification\Traits\DispatchesWithPreferences;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendAuditApprovedNotification implements ShouldQueue
{
    use DispatchesWithPreferences;

    public function handle(AuditDecisionMade $event): void
    {
        $audit = $event->audit->loadMissing(['company.users']);

        $company = $audit->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $this->notifyWithPreferences(
                $user,
                AuditApprovedNotification::forAudit($audit, $event->reviewedBy),
                NotificationType::AuditApproved,
            );
        }
    }
}
