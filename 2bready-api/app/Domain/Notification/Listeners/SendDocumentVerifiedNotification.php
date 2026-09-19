<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Events\DocumentVerified;
use App\Domain\Notification\Notifications\DocumentVerifiedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifies a company's users when a document is verified.
 * Cross-domain: event lives in Document, listener in Notification.
 * Queued so mail never runs on the verification thread.
 */
class SendDocumentVerifiedNotification implements ShouldQueue
{
    public function handle(DocumentVerified $event): void
    {
        $document = $event->document->loadMissing(['company.users', 'documentTemplate']);

        /** @var Company|null $company */
        $company = $document->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $user->notify(DocumentVerifiedNotification::forDocument($document));
        }
    }
}
