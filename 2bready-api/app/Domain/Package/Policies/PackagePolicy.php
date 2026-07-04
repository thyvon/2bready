<?php

declare(strict_types=1);

namespace App\Domain\Package\Policies;

use App\Domain\Package\Models\Package;
use App\Domain\User\Models\User;

class PackagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('package.view');
    }

    public function view(User $user, Package $package): bool
    {
        return $user->can('package.view');
    }

    public function create(User $user): bool
    {
        return $user->can('package.manage');
    }

    public function update(User $user, Package $package): bool
    {
        return $user->can('package.manage');
    }

    public function delete(User $user, Package $package): bool
    {
        return $user->can('package.manage');
    }
}
