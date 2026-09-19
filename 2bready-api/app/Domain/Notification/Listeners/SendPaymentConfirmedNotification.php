<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Company\Models\Company;
use App\Domain\Notification\Notifications\PaymentConfirmedNotification;
use App\Domain\Payment\Events\PaymentConfirmed;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifies a company's users when their payment is confirmed.
 * Cross-domain: event lives in Payment, listener in Notification.
 * Queued so mail never runs on the confirmation thread.
 */
class SendPaymentConfirmedNotification implements ShouldQueue
{
    public function handle(PaymentConfirmed $event): void
    {
        $payment = $event->payment->loadMissing(['company.users', 'payable.package']);

        /** @var Company|null $company */
        $company = $payment->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $user->notify(PaymentConfirmedNotification::forPayment($payment));
        }
    }
}
