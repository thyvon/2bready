<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Policies;

use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;

class TpPartnerPolicy
{
    /**
     * A company_owner may browse firms to hire one — independent of
     * tp_partner.manage, mirroring SubscriptionPolicy::subscribe()'s
     * self-service pattern. TpPartnerController::index() further restricts
     * this caller to active firms only.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('tp_partner.manage')
            || ($user->hasRole('company_owner') && $user->current_company_id !== null);
    }

    public function view(User $user, TpPartner $tpPartner): bool
    {
        return $user->can('tp_partner.manage')
            || $user->auditor?->tp_partner_id === $tpPartner->id;
    }

    public function create(User $user): bool
    {
        return $user->can('tp_partner.manage');
    }

    public function update(User $user, TpPartner $tpPartner): bool
    {
        return $user->can('tp_partner.manage');
    }

    public function delete(User $user, TpPartner $tpPartner): bool
    {
        return $user->can('tp_partner.manage');
    }

    /** Registering a firm's staff — admin-only, same gate as the firm itself. */
    public function manageAuditors(User $user, TpPartner $tpPartner): bool
    {
        return $user->can('tp_partner.manage');
    }
}
