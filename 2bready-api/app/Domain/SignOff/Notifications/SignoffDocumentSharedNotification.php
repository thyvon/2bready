<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a staff member their company shared a platform-verified document
 * with them, and asks them to read it and sign off in the portal. Queued —
 * mail must never block the request thread. Delivery rides the existing
 * MailSettingService SMTP machinery (Mailpit locally).
 */
class SignoffDocumentSharedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $companyName,
        public readonly string $categoryLabel,
        public readonly string $title,
        public readonly string $senderName,
        public readonly string $signoffUrl,
    ) {}

    /** @param  mixed  $notifiable  SignoffDocumentUser's user */
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('Your company shared a verified :category document', ['category' => $this->categoryLabel]))
            ->greeting(__('Hello!'))
            ->line(__(':company shared a verified :category document with you:', [
                'company' => $this->companyName,
                'category' => $this->categoryLabel,
            ]))
            ->line("**{$this->title}**")
            ->line(__('Verified by the 2bReady expert team — please read it and sign off to confirm.'))
            ->line(__('Sent by: :name', ['name' => $this->senderName]))
            ->action(__('Read & Sign'), $this->signoffUrl);
    }
}
