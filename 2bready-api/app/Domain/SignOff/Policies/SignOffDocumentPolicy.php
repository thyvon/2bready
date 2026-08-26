<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Policies;

use App\Domain\SignOff\Enums\SignoffDocumentStatus;
use App\Domain\SignOff\Models\SignoffDocument;
use App\Domain\User\Models\User;

class SignOffDocumentPolicy
{
    /** Company users list their own; internal roles see the whole queue. */
    public function viewAny(User $user): bool
    {
        return $user->can('signoff_document.view')
            || ($user->hasAnyRole(['company_owner', 'company_member']) && $user->current_company_id !== null);
    }

    public function view(User $user, SignoffDocument $document): bool
    {
        if ($user->can('signoff_document.view')) {
            return true;
        }

        return $user->hasAnyRole(['company_owner', 'company_member'])
            && $user->current_company_id === $document->company_id;
    }

    /** Only company-side accounts upload. */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['company_owner', 'company_member'])
            && $user->current_company_id !== null;
    }

    /** Owners may delete their own documents that haven't been verified yet. */
    public function delete(User $user, SignoffDocument $document): bool
    {
        if ($user->can('signoff_document.manage')) {
            return true;
        }

        return $user->hasAnyRole(['company_owner', 'company_member'])
            && $user->current_company_id === $document->company_id
            && $document->status === SignoffDocumentStatus::PendingReview;
    }

    /** Verify / reject — internal experts only (admin/staff). */
    public function verify(User $user): bool
    {
        return $user->can('signoff_document.manage');
    }

    /**
     * Send to staff — company owner/member on their own verified document;
     * internal roles may also re-send.
     */
    public function send(User $user, SignoffDocument $document): bool
    {
        if ($user->can('signoff_document.manage')) {
            return $document->status === SignoffDocumentStatus::Verified;
        }

        return $user->hasAnyRole(['company_owner', 'company_member'])
            && $user->current_company_id === $document->company_id
            && $document->status === SignoffDocumentStatus::Verified;
    }
}
