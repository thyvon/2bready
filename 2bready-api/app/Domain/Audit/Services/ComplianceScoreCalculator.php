<?php

declare(strict_types=1);

namespace App\Domain\Audit\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Enums\DocumentStatus;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use Illuminate\Support\Collection;

/**
 * Pure function (Rule #3): reads evidence, returns a score breakdown, writes
 * nothing. Called from ComplianceScoreService (which applies the result) and
 * never directly from a Controller or Action. The score for an audited level
 * is the share of required document templates at that level that currently
 * have a verified document for the company — the same evidence
 * CompleteMilestoneOnDocumentVerified already uses to auto-complete a
 * milestone, so this score and that completion logic can never disagree.
 */
class ComplianceScoreCalculator
{
    /**
     * @return array{score: int, verified: int, required: int}
     */
    public function calculate(Company $company, string $journeyLevel): array
    {
        $journey = Journey::query()->withoutGlobalScope('company')
            ->where('company_id', $company->id)
            ->first();

        if (! $journey) {
            return ['score' => 0, 'verified' => 0, 'required' => 0];
        }

        $level = $journey->journeyTemplate->levels()
            ->where('code', $journeyLevel)
            ->first();

        if (! $level) {
            return ['score' => 0, 'verified' => 0, 'required' => 0];
        }

        $requiredTemplates = $this->requiredTemplatesAtLevel($level, $company);
        $required = $requiredTemplates->count();

        if ($required === 0) {
            return ['score' => 0, 'verified' => 0, 'required' => 0];
        }

        $verified = $requiredTemplates->filter(
            fn (DocumentTemplate $template) => $this->isTemplateVerified($template, $company),
        )->count();

        return [
            'score' => (int) round(($verified / $required) * 100),
            'verified' => $verified,
            'required' => $required,
        ];
    }

    /**
     * @return Collection<int, DocumentTemplate>
     */
    private function requiredTemplatesAtLevel(JourneyLevel $level, Company $company)
    {
        $milestoneIds = $level->milestones->pluck('id');

        return DocumentTemplate::query()
            ->whereIn('milestone_id', $milestoneIds)
            ->where('is_required', true)
            // Global templates count for every company; company-scoped ones
            // only for their own company (same rule as the milestone-completion
            // listener — one company's private extra requirement must not gate
            // another company sharing the milestone).
            ->where(fn ($query) => $query->whereNull('company_id')->orWhere('company_id', $company->id))
            ->get();
    }

    private function isTemplateVerified(DocumentTemplate $template, Company $company): bool
    {
        // ->latest('id'), not ->latest() (created_at) — same rationale as
        // CompleteMilestoneOnDocumentVerified: the column has no sub-second
        // precision, so ULID-ordering by id is the only reliable true-latest.
        $document = Document::query()
            ->where('company_id', $company->id)
            ->where('document_template_id', $template->id)
            ->latest('id')
            ->first();

        return $document?->status === DocumentStatus::Verified;
    }
}
