<?php

declare(strict_types=1);

namespace App\Domain\Sop\Policies;

use App\Domain\Sop\Models\SopSignoff;
use App\Domain\User\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Sign-off records: SOP-scoped abilities (who may see tracking / send) live
 * on SopPolicy — this policy only covers actions on a SopSignoff itself.
 */
class SopSignoffPolicy
{
    use HandlesAuthorization;

    /**
     * Only the assigned employee acknowledges their own sign-off; admins may
     * do so on behalf of employees.
     */
    public function acknowledge(User $user, SopSignoff $signoff): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $signoff->user_id === $user->id;
    }
}
