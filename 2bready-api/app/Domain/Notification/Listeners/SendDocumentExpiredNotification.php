<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Events\DocumentExpired;
use App\Domain\Notification\Notifications\DocumentExpiredNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifies a company's users the moment one of their recurring documents
 * lapses. Cross-domain by design: the event lives in Document, this
 * listener (in Notification) reacts — Document never reaches into
 * notification delivery itself. Queued so mail never runs on the expiry
 * job's thread. Attaches to the same DocumentExpired event as
 * RevertMilestoneCompletionOnDocumentExpired — both listeners run
 * independently, order doesn't matter.
 */
class SendDocumentExpiredNotification implements ShouldQueue
{
    public function handle(DocumentExpired $event): void
    {
        $document = $event->document->loadMissing(['company.users', 'documentTemplate']);
        /** @var Company|null $company */
        $company = $document->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $user->notify(DocumentExpiredNotification::forDocument($document));
        }
    }
}
