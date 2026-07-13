<?php

declare(strict_types=1);

namespace App\Domain\Document\Policies;

use App\Domain\Document\Models\Document;
use App\Domain\User\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('document.view');
    }

    public function view(User $user, Document $document): bool
    {
        return $user->can('document.view');
    }

    public function upload(User $user): bool
    {
        return $user->can('document.upload');
    }

    public function delete(User $user, Document $document): bool
    {
        return $user->can('document.delete');
    }

    // Verify/reject — admin/staff only, mirrors Journey's admin-signoff-only
    // completion for the same reason (no Auditor domain exists yet to
    // delegate this to).
    public function manage(User $user): bool
    {
        return $user->can('document.manage');
    }
}
