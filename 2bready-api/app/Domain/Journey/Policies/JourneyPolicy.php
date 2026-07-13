<?php

declare(strict_types=1);

namespace App\Domain\Journey\Policies;

use App\Domain\User\Models\User;

class JourneyPolicy
{
    public function view(User $user): bool
    {
        return $user->can('journey.view');
    }

    // Week-1 admin-signoff completion — company_owner/member self-completion
    // (trigger: document_upload) is Week 2, once the automated engine exists.
    public function complete(User $user): bool
    {
        return $user->can('journey.manage');
    }
}
