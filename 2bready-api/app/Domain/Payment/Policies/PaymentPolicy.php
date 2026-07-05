<?php

declare(strict_types=1);

namespace App\Domain\Payment\Policies;

use App\Domain\Payment\Models\Payment;
use App\Domain\User\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('payment.view');
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->can('payment.view') && ($this->isInternal($user) || $user->current_company_id === $payment->company_id);
    }

    /** Company marking their own manual-transfer payment as sent — self-service, like subscribing. */
    public function submit(User $user, Payment $payment): bool
    {
        return $user->hasRole('company_owner') && $user->current_company_id === $payment->company_id;
    }

    public function confirm(User $user, Payment $payment): bool
    {
        return $user->can('payment.manage') && $this->isInternal($user);
    }

    public function reject(User $user, Payment $payment): bool
    {
        return $user->can('payment.manage') && $this->isInternal($user);
    }

    private function isInternal(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'staff', 'finance']);
    }
}
