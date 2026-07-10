<?php

declare(strict_types=1);

namespace App\Domain\Industry\Policies;

use App\Domain\Industry\Models\Industry;
use App\Domain\User\Models\User;

class IndustryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('industry.view');
    }

    public function view(User $user, Industry $industry): bool
    {
        return $user->can('industry.view');
    }

    public function create(User $user): bool
    {
        return $user->can('industry.manage');
    }

    public function update(User $user, Industry $industry): bool
    {
        return $user->can('industry.manage');
    }

    public function delete(User $user, Industry $industry): bool
    {
        return $user->can('industry.manage');
    }
}
