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
 * A company can't owe a filing before the requirement itself existed
 * (template.created_at) or before its own compliance obligation began.
 * `compliance_start_date` — when set — is the company's real history (e.g.
 * incorporation), which may predate when it joined 2bReady; left null, the
 * journey's own activation date is the anchor, reproducing the
 * pre-backfill-feature behavior exactly.
 */
class ComplianceAnchorResolver
{
    public function resolve(Company $company, ?Journey $journey, DocumentTemplate $template): CarbonInterface
    {
        $journeyActivatedAt = $journey?->activated_at ?? now();
        $complianceAnchor = $company->compliance_start_date ?? $journeyActivatedAt;

        return $template->created_at->greaterThan($complianceAnchor)
            ? $template->created_at
            : $complianceAnchor;
    }
}
