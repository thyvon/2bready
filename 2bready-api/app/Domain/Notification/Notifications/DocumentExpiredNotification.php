<?php

declare(strict_types=1);

namespace App\Domain\Notification\Notifications;

use App\Domain\Document\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a company a recurring document has now lapsed. Sent by
 * SendDocumentExpiredNotification (listener on DocumentExpired) to every
 * user of the owning company. Deliberately silent on journey-level impact —
 * RevertMilestoneCompletionOnDocumentExpired (a separate listener on the
 * same event) is what actually reverts the milestone; this notification
 * doesn't need to duplicate that logic, just report the fact.
 */
class DocumentExpiredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly string $documentName) {}

    public static function forDocument(Document $document): self
    {
        return new self($document->documentTemplate->name);
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Expired: \"{$this->documentName}\" needs renewal")
            ->line("Your compliance document \"{$this->documentName}\" has expired.")
            ->line('Upload a current version to restore this requirement to good standing.');
    }
}
