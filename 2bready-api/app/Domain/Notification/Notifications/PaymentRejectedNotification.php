<?php

declare(strict_types=1);

namespace App\Domain\Notification\Notifications;

use App\Domain\Payment\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a company user their payment was rejected.
 * Sent by SendPaymentRejectedNotification (listener on PaymentRejected).
 */
class PaymentRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $amountCents,
        public readonly string $currency,
        public readonly string $packageName,
    ) {}

    public static function forPayment(Payment $payment): self
    {
        return new self(
            $payment->amount_cents,
            $payment->currency,
            $payment->payable?->package?->name ?? 'Unknown',
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
        $amount = number_format($this->amountCents / 100, 2);

        return [
            'title' => "Payment rejected — {$this->packageName}",
            'message' => "Your payment of {$this->currency} {$amount} for {$this->packageName} was not accepted.",
            'action_url' => config('app.client_url', '/portal'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $amount = number_format($this->amountCents / 100, 2);

        return (new MailMessage)
            ->subject("Payment rejected — {$this->packageName}")
            ->line("Your payment of {$this->currency} {$amount} for **{$this->packageName}** was not accepted.")
            ->line('Please contact support or try again with a different payment method.')
            ->action('View your billing', config('app.client_url', '/portal'));
    }
}
