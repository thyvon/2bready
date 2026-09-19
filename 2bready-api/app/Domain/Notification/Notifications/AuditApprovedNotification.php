<?php

declare(strict_types=1);

namespace App\Domain\Notification\Notifications;

use App\Domain\Audit\Models\Audit;
use App\Domain\User\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a company their audit was approved. The approval triggers
 * compliance scoring and trust badge issuance via separate listeners
 * on the same AuditDecisionMade event — this notification is purely
 * informational.
 */
class AuditApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $levelCode,
        public readonly string $reviewerName,
    ) {}

    public static function forAudit(Audit $audit, User $reviewedBy): self
    {
        return new self(
            $audit->journey_level,
            $reviewedBy->name,
        );
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
            'title' => "Audit approved — {$this->levelCode}",
            'message' => "Your {$this->levelCode} compliance audit has been approved by {$this->reviewerName}.",
            'action_url' => config('app.client_url', '/portal'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Audit approved — {$this->levelCode}")
            ->line("Your **{$this->levelCode}** compliance audit has been approved by {$this->reviewerName}.")
            ->line('Your compliance score has been updated and your trust badge reflects the new status.')
            ->action('View your journey', config('app.client_url', '/portal'));
    }
}
