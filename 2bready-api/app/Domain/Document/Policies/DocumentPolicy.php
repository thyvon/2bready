<?php

declare(strict_types=1);

namespace App\Domain\Document\Policies;

use App\Domain\Document\Models\Document;
use App\Domain\Marketplace\Models\TpHire;
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

    // Verify/reject — either admin/staff (unrestricted), or a TP/auditor
    // whose firm has an active TpHire for this specific document's company
    // (document.manage.assigned). withoutGlobalScope('company') here because
    // the caller in the second branch is never company-bypassed the way
    // admin/staff are — after BelongsToCompany's null-current_company_id fix,
    // an unscoped query from that account would otherwise match nothing.
    public function manage(User $user, Document $document): bool
    {
        if ($user->can('document.manage')) {
            return true;
        }

        return $user->can('document.manage.assigned')
            && TpHire::query()->withoutGlobalScope('company')
                ->where('tp_partner_id', $user->auditor?->tp_partner_id)
                ->where('company_id', $document->company_id)
                ->where('status', 'active')
                ->exists();
    }
}
