<?php

declare(strict_types=1);

namespace App\Domain\Notification\Notifications;

use App\Domain\Document\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a company user their document has been verified.
 * Sent by SendDocumentVerifiedNotification (listener on DocumentVerified).
 * Separate from the milestone-completion logic — purely informational.
 */
class DocumentVerifiedNotification extends Notification implements ShouldQueue
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
        return ['mail', 'database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "Document verified: \"{$this->documentName}\"",
            'message' => "Your compliance document \"{$this->documentName}\" has been verified.",
            'action_url' => config('app.client_url', '/portal'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Document verified: \"{$this->documentName}\"")
            ->line("Your compliance document \"{$this->documentName}\" has been verified.")
            ->line('This requirement is now in good standing.');
    }
}
