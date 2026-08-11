<?php

declare(strict_types=1);

namespace App\Domain\Document\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Journey;
use Carbon\CarbonInterface;

/**
 * How far back a periodic template's "missing period" gap detection should
 * reach — shared by JourneyController (building the history a company/staff
 * sees), the backfill-upload validation rule (deciding which periods a
 * company may file against), and CompleteMilestoneOnDocumentVerified
 * (deciding whether a milestone may complete). One formula, one place, so
 * all three always agree on what counts as "owed."
 *
 * `compliance_start_date` — when set — is the company's real history (e.g.
 * incorporation), which may predate when it joined 2bReady; left null, the
 * journey's own activation date is the anchor.
 *
 * `template.effective_since` is a deliberate, admin-set override for one
 * specific requirement that genuinely started applying at its own later
 * date (e.g. a regulation introduced after some companies already
 * onboarded) — it can only push the anchor *later* than the company's own
 * anchor, never earlier. Left null (the default), a template defers
 * entirely to the company's own anchor. This deliberately does NOT use
 * template.created_at (the row's insertion date) as a floor — that's an
 * implementation detail, not a business fact, and would silently defeat
 * compliance_start_date for any template created after this feature
 * shipped (which, this week, is every real one).
 */
class ComplianceAnchorResolver
{
    public function resolve(Company $company, ?Journey $journey, DocumentTemplate $template): CarbonInterface
    {
        $journeyActivatedAt = $journey->activated_at ?? now();
        $companyAnchor = $company->compliance_start_date ?? $journeyActivatedAt;

        if ($template->effective_since && $template->effective_since->greaterThan($companyAnchor)) {
            return $template->effective_since;
        }

        return $companyAnchor;
    }
}
