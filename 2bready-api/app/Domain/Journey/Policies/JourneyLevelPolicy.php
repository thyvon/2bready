<?php

declare(strict_types=1);

namespace App\Domain\Journey\Policies;

use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\User\Models\User;

class JourneyLevelPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('journey_template.view');
    }

    public function view(User $user, JourneyLevel $journeyLevel): bool
    {
        return $user->can('journey_template.view');
    }

    public function create(User $user): bool
    {
        return $user->can('journey_template.manage');
    }

    public function update(User $user, JourneyLevel $journeyLevel): bool
    {
        return $user->can('journey_template.manage');
    }

    public function delete(User $user, JourneyLevel $journeyLevel): bool
    {
        return $user->can('journey_template.manage');
    }
}
