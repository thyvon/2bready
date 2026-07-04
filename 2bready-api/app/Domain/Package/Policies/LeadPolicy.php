<?php

declare(strict_types=1);

namespace App\Domain\Package\Policies;

use App\Domain\User\Models\User;

class LeadPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('lead.view');
    }
}
