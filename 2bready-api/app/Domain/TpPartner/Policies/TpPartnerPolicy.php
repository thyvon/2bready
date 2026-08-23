<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Policies;

use App\Domain\TpPartner\Enums\TpPartnerStatus;
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

    /**
     * Sprint 7 onboarding approval — admin-only, and only a pending
     * application can be approved (active/suspended firms are managed
     * through update()'s status field instead).
     */
    public function approve(User $user, TpPartner $tpPartner): bool
    {
        return $user->can('tp_partner.manage')
            && $tpPartner->status === TpPartnerStatus::PendingApproval;
    }

    /**
     * A firm's own auditors may tune the per-level prices their firm charges
     * companies (Sprint 7 self-service pricing, see MVP Proposal §0.3) — but
     * only the prices, never the firm's identity or status, which remain
     * admin-only through update(). The dedicated /pricing endpoint exposes
     * exactly this slice.
     */
    public function updatePricing(User $user, TpPartner $tpPartner): bool
    {
        return $user->can('tp_partner.manage')
            || $user->auditor?->tp_partner_id === $tpPartner->id;
    }

    /**
     * A firm's own auditors may maintain their firm's identity fields (name
     * / name_kh) through the dedicated /profile endpoint — the same
     * self-service slice as updatePricing, deliberately without name/status
     * reach: status stays admin-only so a firm can never un-suspend itself.
     */
    public function updateProfile(User $user, TpPartner $tpPartner): bool
    {
        return $user->can('tp_partner.manage')
            || $user->auditor?->tp_partner_id === $tpPartner->id;
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
