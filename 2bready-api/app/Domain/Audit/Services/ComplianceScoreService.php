<?php

declare(strict_types=1);

namespace App\Domain\Audit\Services;

use App\Domain\Audit\Models\Audit;
use App\Domain\Company\Models\Company;
use App\Domain\Journey\Actions\CompleteMilestoneAction;
use App\Domain\Journey\Enums\MilestoneCompletionTrigger;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;

/**
 * Applies an approved audit's result to the company (Rule #3) — updates the
 * company's compliance score and completes the audited level's milestones
 * with the AuditApproval trigger. Never called from a Controller or Action:
 * only UpdateComplianceScoreListener may invoke this, wiring the
 * AuditDecisionMade event to the score/milestone side effects exactly as
 * documented.
 */
class ComplianceScoreService
{
    public function __construct(
        private readonly ComplianceScoreCalculator $calculator,
        private readonly CompleteMilestoneAction $completeMilestoneAction,
    ) {}

    public function apply(Audit $audit): void
    {
        /** @var Company $company */
        $company = $audit->company;

        $breakdown = $this->calculator->calculate($company, $audit->journey_level);

        $company->update([
            'compliance_score' => $breakdown['score'],
        ]);

        // The audit's authoritative score is the evidence-derived one,
        // finalized at approval — not the raw recommendation the auditor
        // typed at submit. The pre-approval value is preserved in the audit
        // log (the Auditable trait records the update diff).
        $audit->update([
            'score' => $breakdown['score'],
        ]);

        $this->completeLevelMilestones($audit, $company);
    }

    private function completeLevelMilestones(Audit $audit, Company $company): void
    {
        $journey = Journey::query()->withoutGlobalScope('company')
            ->where('company_id', $audit->company_id)
            ->first();

        if (! $journey) {
            return;
        }

        $level = $journey->journeyTemplate->levels()
            ->where('code', $audit->journey_level)
            ->first();

        if (! $level) {
            return;
        }

        /** @var JourneyLevel $level */
        $level->milestones->each(function ($milestone) use ($company) {
            $this->completeMilestoneAction->execute(
                $company,
                $milestone,
                null,
                MilestoneCompletionTrigger::AuditApproval,
            );
        });
    }
}
