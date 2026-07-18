<?php

declare(strict_types=1);

namespace App\Domain\AuditLog\Policies;

use App\Domain\User\Models\User;

class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('audit_log.view');
    }
}
