<?php

declare(strict_types=1);

namespace App\Domain\Audit\Policies;

use App\Domain\Audit\Models\Audit;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\User\Models\User;

class AuditPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('audit.view');
    }

    public function view(User $user, Audit $audit): bool
    {
        if (! $user->can('audit.view')) {
            return false;
        }

        if ($user->hasAnyRole(['admin', 'staff', 'finance'])) {
            return true;
        }

        // The assigned auditor's own firm — a TP may view the audits they are
        // engaged on, even before one is individually assigned to them. The
        // hire-level check is the same one DocumentPolicy::manage() uses, and
        // deliberately uses withoutGlobalScope('company') for the same reason
        // (a TP caller is never company-bypassed).
        if ($user->auditor) {
            return TpHire::query()->withoutGlobalScope('company')
                ->where('tp_partner_id', $user->auditor->tp_partner_id)
                ->where('company_id', $audit->company_id)
                ->where('journey_level', $audit->journey_level)
                ->where('status', 'active')
                ->exists();
        }

        // company_owner/member — must belong to the audited company.
        return $user->companies()->where('companies.id', $audit->company_id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->can('audit.manage');
    }

    public function assign(User $user, Audit $audit): bool
    {
        return $user->can('audit.manage');
    }

    /**
     * Only the individually assigned auditor may submit — merely belonging to
     * the hired firm is not enough (that would let any of the firm's staff
     * submit an audit another colleague was assigned).
     */
    public function submit(User $user, Audit $audit): bool
    {
        return $user->can('audit.conduct')
            && $user->auditor !== null
            && $audit->auditor_id === $user->auditor->id;
    }

    public function review(User $user, Audit $audit): bool
    {
        return $user->can('audit.manage');
    }

    public function cancel(User $user, Audit $audit): bool
    {
        return $user->can('audit.manage');
    }
}
