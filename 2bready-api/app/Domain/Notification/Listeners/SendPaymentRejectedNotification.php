<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Company\Models\Company;
use App\Domain\Notification\Notifications\PaymentRejectedNotification;
use App\Domain\Payment\Events\PaymentRejected;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Notifies a company's users when their payment is rejected.
 * Cross-domain: event lives in Payment, listener in Notification.
 */
class SendPaymentRejectedNotification implements ShouldQueue
{
    public function handle(PaymentRejected $event): void
    {
        $payment = $event->payment->loadMissing(['company.users', 'payable.package']);

        /** @var Company|null $company */
        $company = $payment->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $user->notify(PaymentRejectedNotification::forPayment($payment));
        }
    }
}
