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

    /**
     * Company self-scoped child creation — a company may add a sub-document
     * template under a parent template if:
     *   - the parent template is visible to their company (global or their own),
     *   - the parent allows client additions (client_can_add_subdocs),
     *   - the user has document.upload permission (they can upload documents).
     */
    public function addChild(User $user, DocumentTemplate $parent): bool
    {
        if (! $user->can('document.upload')) {
            return false;
        }

        if (! $parent->client_can_add_subdocs) {
            return false;
        }

        // Admin/staff bypass company scope
        if ($user->hasAnyRole(['admin', 'staff', 'finance'])) {
            return true;
        }

        // company_owner/member — parent must be global (company_id null)
        // or already scoped to their own company
        $companyId = $user->current_company_id;

        return $companyId !== null
            && ($parent->company_id === null || $parent->company_id === $companyId);
    }

    /**
     * Company self-scoped update — a company may update their own sub-document
     * if it belongs to them (company_id matches current company).
     */
    public function updateOwn(User $user, DocumentTemplate $document): bool
    {
        if (! $user->can('document.upload')) {
            return false;
        }

        if ($user->hasAnyRole(['admin', 'staff', 'finance'])) {
            return true;
        }

        $companyId = $user->current_company_id;

        return $companyId !== null && $document->company_id === $companyId;
    }

    /**
     * Company self-scoped delete — a company may delete their own sub-document
     * if it belongs to them (company_id matches current company).
     */
    public function deleteOwn(User $user, DocumentTemplate $document): bool
    {
        if (! $user->can('document.upload')) {
            return false;
        }

        if ($user->hasAnyRole(['admin', 'staff', 'finance'])) {
            return true;
        }

        $companyId = $user->current_company_id;

        return $companyId !== null && $document->company_id === $companyId;
    }
}
