<?php

declare(strict_types=1);

namespace App\Domain\Journey\Policies;

use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\User\Models\User;

class JourneyTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('journey_template.view');
    }

    public function view(User $user, JourneyTemplate $journeyTemplate): bool
    {
        return $user->can('journey_template.view');
    }

    public function create(User $user): bool
    {
        return $user->can('journey_template.manage');
    }

    public function update(User $user, JourneyTemplate $journeyTemplate): bool
    {
        return $user->can('journey_template.manage');
    }

    public function delete(User $user, JourneyTemplate $journeyTemplate): bool
    {
        return $user->can('journey_template.manage');
    }
}
