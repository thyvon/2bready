<?php

declare(strict_types=1);

namespace App\Domain\User\Policies;

use App\Domain\User\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('user.manage');
    }

    public function view(User $user, User $target): bool
    {
        return $user->can('user.manage');
    }

    public function create(User $user): bool
    {
        return $user->can('user.manage');
    }

    public function update(User $user, User $target): bool
    {
        return $user->can('user.manage');
    }
}
