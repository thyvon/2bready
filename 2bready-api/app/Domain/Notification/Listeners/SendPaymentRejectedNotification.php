<?php

declare(strict_types=1);

namespace App\Domain\Notification\Listeners;

use App\Domain\Company\Models\Company;
use App\Domain\Notification\Enums\NotificationType;
use App\Domain\Notification\Notifications\PaymentRejectedNotification;
use App\Domain\Notification\Traits\DispatchesWithPreferences;
use App\Domain\Payment\Events\PaymentRejected;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendPaymentRejectedNotification implements ShouldQueue
{
    use DispatchesWithPreferences;

    public function handle(PaymentRejected $event): void
    {
        $payment = $event->payment->loadMissing(['company.users', 'payable.package']);

        /** @var Company|null $company */
        $company = $payment->company;

        if ($company === null) {
            return;
        }

        foreach ($company->users as $user) {
            $this->notifyWithPreferences(
                $user,
                PaymentRejectedNotification::forPayment($payment),
                NotificationType::PaymentRejected,
            );
        }
    }
}
