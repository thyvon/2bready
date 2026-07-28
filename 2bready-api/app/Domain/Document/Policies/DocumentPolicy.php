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

    // Bug found while wiring TP portal's document preview: previewUrl()'s
    // implicit {document} route binding relies on BelongsToCompany's global
    // scope to restrict a lookup to the caller's own company — that works
    // for company_owner/member (their current_company_id matches) and is a
    // no-op for admin/staff (role-bypassed), but a TP/auditor caller is
    // neither, so after BelongsToCompany's null-current_company_id fix the
    // scoped binding 404s before this policy ever runs, for every document
    // regardless of id. previewUrl() now resolves manually with
    // withoutGlobalScope('company') (same pattern as verify/reject) and
    // relies entirely on this method for the tenant check that used to come
    // from the scope — so every caller type needs an explicit branch here,
    // not just document.view's blanket permission.
    public function view(User $user, Document $document): bool
    {
        if (! $user->can('document.view')) {
            return false;
        }

        if ($user->hasAnyRole(['admin', 'staff', 'finance'])) {
            return true;
        }

        if ($user->auditor) {
            $journeyLevel = $document->documentTemplate?->milestone?->journeyLevel?->code;

            return $journeyLevel !== null
                && TpHire::query()->withoutGlobalScope('company')
                    ->where('tp_partner_id', $user->auditor->tp_partner_id)
                    ->where('company_id', $document->company_id)
                    ->where('journey_level', $journeyLevel)
                    ->where('status', 'active')
                    ->exists();
        }

        // company_owner/member — must belong to this document's own company.
        return $user->companies()->where('companies.id', $document->company_id)->exists();
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
    // AND journey level (document.manage.assigned). A firm hired for L2
    // only must not be able to touch that same company's L3/L4 documents —
    // TpHire.journey_level is the one source of truth for what a firm was
    // actually paid to review. withoutGlobalScope('company') here because
    // the caller in the second branch is never company-bypassed the way
    // admin/staff are — after BelongsToCompany's null-current_company_id fix,
    // an unscoped query from that account would otherwise match nothing.
    public function manage(User $user, Document $document): bool
    {
        if ($user->can('document.manage')) {
            return true;
        }

        if (! $user->can('document.manage.assigned')) {
            return false;
        }

        $journeyLevel = $document->documentTemplate?->milestone?->journeyLevel?->code;

        return $journeyLevel !== null
            && TpHire::query()->withoutGlobalScope('company')
                ->where('tp_partner_id', $user->auditor?->tp_partner_id)
                ->where('company_id', $document->company_id)
                ->where('journey_level', $journeyLevel)
                ->where('status', 'active')
                ->exists();
    }
}
