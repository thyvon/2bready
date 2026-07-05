<?php

declare(strict_types=1);

namespace App\Domain\Payment\Policies;

use App\Domain\Payment\Models\Subscription;
use App\Domain\User\Models\User;

class SubscriptionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('subscription.view');
    }

    public function view(User $user, Subscription $subscription): bool
    {
        return $user->can('subscription.view') && ($this->isInternal($user) || $user->current_company_id === $subscription->company_id);
    }

    /**
     * Subscribing is deliberately independent of subscription.manage (the internal
     * override permission) — a company_owner subscribes their own company to a
     * package, they don't need staff-level subscription management rights, mirroring
     * CompanyPolicy::registerOwn's self-service pattern. Acts on whichever company
     * is currently active (§0.7 of the MVP proposal) — a user with several
     * companies subscribes them one at a time, switching between them first.
     */
    public function subscribe(User $user): bool
    {
        return $user->hasRole('company_owner') && $user->current_company_id !== null;
    }

    private function isInternal(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'staff', 'finance']);
    }
}
