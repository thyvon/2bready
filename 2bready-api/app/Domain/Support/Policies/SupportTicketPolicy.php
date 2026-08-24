<?php

declare(strict_types=1);

namespace App\Domain\Support\Policies;

use App\Domain\Support\Models\SupportTicket;
use App\Domain\User\Models\User;

class SupportTicketPolicy
{
    /**
     * Index scoping is BelongsToCompany's job (company users see their own,
     * internal roles see everything) — the policy just gates who may list.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('support.view')
            || $user->can('support.create');
    }

    /** Company participants and the internal team can read a thread. */
    public function view(User $user, SupportTicket $supportTicket): bool
    {
        if ($user->can('support.manage')) {
            return true;
        }

        return ($user->hasRole('company_owner') || $user->hasRole('company_member'))
            && $user->current_company_id === $supportTicket->company_id;
    }

    /** Only company-side accounts open tickets — admins reply, they don't file. */
    public function create(User $user): bool
    {
        return $user->can('support.create')
            && ($user->hasRole('company_owner') || $user->hasRole('company_member'))
            && $user->current_company_id !== null;
    }

    /**
     * Replying: company participants while the ticket isn't closed; the
     * internal team (support.manage) on anything.
     */
    public function reply(User $user, SupportTicket $supportTicket): bool
    {
        if ($user->can('support.manage')) {
            return true;
        }

        return $user->can('support.create')
            && $user->current_company_id === $supportTicket->company_id
            && $supportTicket->status->value !== 'closed';
    }

    /** Assign / resolve / close / reopen — the internal team only. */
    public function manage(User $user): bool
    {
        return $user->can('support.manage');
    }

    /**
     * A company may close its own ticket at any time before it's already
     * closed — "never mind, solved it ourselves" must not need an admin.
     * The internal team may always move status; the action still refuses
     * illegal transitions (e.g. anything off a closed ticket except reopen).
     */
    public function close(User $user, SupportTicket $supportTicket): bool
    {
        if ($user->can('support.manage')) {
            return true;
        }

        return $user->can('support.create')
            && $user->current_company_id === $supportTicket->company_id
            && $supportTicket->status->value !== 'closed';
    }
}
