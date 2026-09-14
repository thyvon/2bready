<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\Models\SopSignoff;
use App\Domain\User\Models\User;

/**
 * Stamps an employee's read-&-acknowledge on a pending sign-off. Already
 * acknowledged sign-offs are returned untouched (idempotent).
 */
class AcknowledgeSopSignoffAction
{
    public function execute(SopSignoff $signoff, User $user): SopSignoff
    {
        if ($signoff->signed_at !== null) {
            return $signoff;
        }

        $signoff->update(['signed_at' => now()]);

        return $signoff->fresh();
    }
}
