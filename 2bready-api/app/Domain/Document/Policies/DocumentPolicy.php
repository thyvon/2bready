<?php

declare(strict_types=1);

namespace App\Domain\Document\Policies;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\LegalConsent\Services\LegalConsentAccessService;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\User\Models\User;
use App\Domain\Vault\Services\VaultAccessService;

class DocumentPolicy
{
    public function __construct(
        private readonly VaultAccessService $vault,
        private readonly LegalConsentAccessService $legalConsent,
    ) {}

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
            // Back-office vault gate (v3 §4.2/§5.1): sensitive L3/L4 documents
            // are only viewable while this user holds an open vault session
            // for the document's company. Only admin/finance can open a
            // session (route middleware), so staff simply can't preview
            // sensitive docs; finance is further restricted to documents they
            // themselves uploaded (uploadedBy === 'finance' from the blueprint).
            if ($this->vault->isSensitive($document)) {
                /** @var Company|null $company */
                $company = $document->company;
                if ($company === null) {
                    return false;
                }

                if (! $this->vault->isUnlocked($user, $company)) {
                    return false;
                }

                if ($user->hasRole('finance') && $document->uploaded_by_user_id !== $user->id) {
                    return false;
                }
            }

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

        // company_owner/member — must belong to this document's own company,
        // and must hold a current legal consent to view a restricted P3/P4
        // (L3/L4) document (v3 §4.2 — client-side consent gating). Back-office
        // review of the same documents is gated by the Vault above instead.
        $belongsToCompany = $user->companies()->where('companies.id', $document->company_id)->exists();
        if (! $belongsToCompany) {
            return false;
        }

        /** @var Company|null $company */
        $company = $document->company;

        return $company !== null && $this->legalConsent->hasAccepted($user, $company, $document);
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
