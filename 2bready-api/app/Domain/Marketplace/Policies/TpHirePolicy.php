<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Policies;

use App\Domain\Marketplace\Models\TpHire;
use App\Domain\User\Models\User;

class TpHirePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('marketplace.manage') || $user->can('portal.tp.access');
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

    public function complete(User $user, TpHire $tpHire): bool
    {
        return $user->can('marketplace.manage')
            || $user->auditor?->tp_partner_id === $tpHire->tp_partner_id;
    }

    public function markPaidOut(User $user): bool
    {
        return $user->can('marketplace.manage');
    }
}
