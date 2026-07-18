<?php

declare(strict_types=1);

namespace App\Domain\Document\Policies;

use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\User\Models\User;

class DocumentTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('document_template.view');
    }

    public function view(User $user, DocumentTemplate $documentTemplate): bool
    {
        return $user->can('document_template.view');
    }

    public function create(User $user): bool
    {
        return $user->can('document_template.manage');
    }

    public function update(User $user, DocumentTemplate $documentTemplate): bool
    {
        return $user->can('document_template.manage');
    }

    public function delete(User $user, DocumentTemplate $documentTemplate): bool
    {
        return $user->can('document_template.manage');
    }
}
