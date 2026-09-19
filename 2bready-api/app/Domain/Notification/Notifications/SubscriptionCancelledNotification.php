<?php

declare(strict_types=1);

namespace App\Domain\Notification\Notifications;

use App\Domain\Payment\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a company user their subscription has been cancelled.
 * Sent by SendSubscriptionCancelledNotification (listener on SubscriptionCancelled).
 */
class SubscriptionCancelledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly string $packageName) {}

    public static function forSubscription(Subscription $subscription): self
    {
        return new self($subscription->package?->name ?? 'Unknown');
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
            'title' => "Subscription cancelled — {$this->packageName}",
            'message' => "Your {$this->packageName} subscription has been cancelled.",
            'action_url' => config('app.client_url', '/portal'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Subscription cancelled — {$this->packageName}")
            ->line("Your **{$this->packageName}** subscription has been cancelled.")
            ->line('Your access to premium features will continue until the current billing period ends.')
            ->action('Resubscribe', config('app.client_url', '/portal'));
    }
}
