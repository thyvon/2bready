<?php

declare(strict_types=1);

namespace App\Domain\Notification\Notifications;

use App\Domain\Document\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Warns a company that a recurring document is about to lapse, while there
 * is still time to renew and keep the journey level. Sent by
 * SendDocumentExpiryRemindersJob to every user of the owning company. Queued
 * — mail must never block the scheduled job's thread. Mail delivery is
 * already wired via MailSettingService (DB-backed SMTP applied at boot), so
 * this needs no extra config — it lands in Mailpit/the log until SMTP
 * settings are configured, same as every other notification in this app.
 */
class DocumentExpiringNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $documentName,
        public readonly string $expiresAtHuman,
    ) {}

    public static function forDocument(Document $document): self
    {
        return new self(
            $document->documentTemplate->name,
            $document->expires_at?->toFormattedDayDateString() ?? 'soon',
        );
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Action needed: \"{$this->documentName}\" is expiring")
            ->line("Your compliance document \"{$this->documentName}\" expires on {$this->expiresAtHuman}.")
            ->line('Upload a renewed version before then to keep your journey level and trust badge current.')
            ->line('If you have already renewed it, you can ignore this message.');
    }
}
