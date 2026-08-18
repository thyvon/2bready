<?php

declare(strict_types=1);

namespace App\Domain\LegalConsent\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\LegalConsent\Enums\PathwayLevel;
use App\Domain\LegalConsent\Models\LegalConsent;
use App\Domain\User\Models\User;

/**
 * Client-side consent gate (v3 §4.2/§5.1): before a company user can act on
 * a restricted P3/P4 (L3/L4) document — preview, download, upload — they must
 * hold an accepted LegalConsent for that pathway at the CURRENT consent-text
 * version. A consent accepted under an older version is deliberately NOT
 * valid anymore (that's the point of versioning) and the modal must be shown
 * again. Back-office review is exempt — it's gated by the Vault instead.
 */
class LegalConsentAccessService
{
    public function __construct(private readonly LegalConsentService $service) {}

    /**
     * True when the user has accepted the current consent version for this
     * restricted pathway level. `document` is used to resolve the pathway —
     * pass it directly rather than a raw level code so callers can't
     * misremember which levels are restricted.
     */
    public function hasAccepted(User $user, Company $company, Document $document): bool
    {
        $pathway = $this->pathwayFor($document);

        if (! $pathway) {
            return true;
        }

        return $this->hasAcceptedForPathway($user, $company, $pathway);
    }

    /** @return PathwayLevel|null null when the document isn't restricted */
    public function pathwayFor(Document $document): ?PathwayLevel
    {
        $code = $document->documentTemplate?->milestone?->journeyLevel?->code;

        return $code ? $this->service->pathwayForLevel($code) : null;
    }

    /** @return PathwayLevel|null the pathway a template sits in, or null if not restricted */
    public function pathwayForTemplate(DocumentTemplate $template): ?PathwayLevel
    {
        $code = $template->milestone?->journeyLevel?->code;

        return $code ? $this->service->pathwayForLevel($code) : null;
    }

    public function hasAcceptedForPathway(User $user, Company $company, PathwayLevel $pathway): bool
    {
        return LegalConsent::query()
            ->withoutGlobalScope('company')
            ->where('user_id', $user->id)
            ->where('company_id', $company->id)
            ->where('pathway_level', $pathway)
            ->where('consent_text_version', $this->service->currentVersion())
            ->exists();
    }
}
