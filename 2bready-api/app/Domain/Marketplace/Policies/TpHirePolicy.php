<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Policies;

use App\Domain\Marketplace\Enums\TpHireStatus;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\User\Models\User;

class TpHirePolicy
{
    /**
     * A company_owner may list their own hires too ("Your Auditor" in
     * client-portal) — BelongsToCompany's global scope already restricts
     * the result set to their own company for any non-internal caller, so
     * this is tenant-safe without any extra filtering here.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('marketplace.manage')
            || $user->can('portal.tp.access')
            || ($user->hasRole('company_owner') && $user->current_company_id !== null);
    }

    public function view(User $user, TpHire $tpHire): bool
    {
        return $user->can('marketplace.manage')
            || $user->auditor?->tp_partner_id === $tpHire->tp_partner_id;
    }

    public function create(User $user): bool
    {
        return $user->can('marketplace.manage');
    }

    /**
     * Self-service hiring — deliberately independent of marketplace.manage
     * (the admin-override permission used by create() above). A company_owner
     * hires a firm for their own company, mirroring
     * SubscriptionPolicy::subscribe()'s exact pattern.
     */
    public function hire(User $user): bool
    {
        return $user->hasRole('company_owner') && $user->current_company_id !== null;
    }

    public function complete(User $user, TpHire $tpHire): bool
    {
        return $user->can('marketplace.manage')
            || $user->auditor?->tp_partner_id === $tpHire->tp_partner_id;
    }

    public function markPaidOut(User $user): bool
    {
        return $user->can('marketplace.manage');
    }

    /**
     * The marketplace unhire flow. A company may self-cancel ONLY while the
     * hire is still pending_payment — money has not moved yet. Once the
     * payment is confirmed the hire is active, and cancelling would strand a
     * confirmed payment without any refund machinery (v1 has none); that
     * becomes an admin-only mediation decision instead. Admin keeps the
     * back-office override for exactly those support/refund cases.
     */
    public function cancel(User $user, TpHire $tpHire): bool
    {
        if ($user->can('marketplace.manage')) {
            return true;
        }

        return $user->hasRole('company_owner')
            && $user->current_company_id === $tpHire->company_id
            && $tpHire->status === TpHireStatus::PendingPayment;
    }

    /**
     * Rating is a company verdict — only a company_owner of the company
     * that hired the firm may rate a completed engagement. Admins do not
     * rate on a company's behalf; that would be the platform writing its
     * own reputation, which defeats the marketplace's social proof.
     */
    public function rate(User $user, TpHire $tpHire): bool
    {
        return $user->hasRole('company_owner') && $user->current_company_id === $tpHire->company_id;
    }
}
