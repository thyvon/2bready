<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Document\Events\DocumentVerified;
use App\Domain\Notification\Enums\NotificationType;
use App\Domain\Notification\Notifications\DocumentVerifiedNotification;
use App\Domain\Notification\Traits\DispatchesWithPreferences;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendDocumentVerifiedNotification implements ShouldQueue
{
    use DispatchesWithPreferences;

    public function handle(DocumentVerified $event): void
    {
        $document = $event->document->loadMissing(['company.users', 'documentTemplate']);

        $company = $document->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $this->notifyWithPreferences(
                $user,
                DocumentVerifiedNotification::forDocument($document),
                NotificationType::DocumentVerified,
            );
        }
    }
}
