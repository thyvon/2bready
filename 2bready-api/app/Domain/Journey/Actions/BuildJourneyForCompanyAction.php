<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Actions\BuildPeriodicHistoryAction;
use App\Domain\Document\DTOs\PeriodHistoryEntry;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Document\Services\ComplianceAnchorResolver;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\Milestone;

/**
 * Loads a company's Journey and combines it with the Document domain's live
 * per-template status into the full Level > Milestone > DocumentTemplate
 * tree — the one piece of logic both JourneyController (admin/company-self
 * view) and TpAssignmentController (TP-self view) need, extracted here once
 * both had a real reason to call it (this project's "factor out on the 2nd
 * use, not the 3rd" convention). Attached as a dynamic `documentTemplates`
 * relation per milestone (mirrors DocumentController::templates()'s
 * `latest_document` pattern) rather than a real Eloquent relation, since
 * Journey's Milestone model shouldn't need to know Document domain exists.
 *
 * $bypassCompanyScope controls whether the Journey lookup itself removes
 * BelongsToCompany's global scope. JourneyController's callers don't pass
 * it: admin/staff are already role-bypassed there, and a company_owner
 * hitting showForCompany with someone else's ID *relies* on the scope
 * stacking with the explicit where() below to quietly find nothing (see
 * that test's own comment) — removing it unconditionally would turn that
 * 404 into a real cross-tenant leak. TpAssignmentController passes true:
 * its TP/auditor caller is never company-bypassed and always has a null
 * current_company_id, so after BelongsToCompany's null-current_company_id
 * fix the scoped query would match nothing at all regardless of
 * $companyId — that caller's own active-hire check is what authorizes
 * this specific company, so bypassing here isn't a leak for it either.
 *
 * The Document lookup below always bypasses the scope unconditionally —
 * unlike Journey, no caller's authorization depends on its automatic
 * constraint (by the time it runs, $companyId access is already settled:
 * either the Journey fetch above already confirmed it, or the caller did).
 */
class BuildJourneyForCompanyAction
{
    public function __construct(
        private readonly BuildPeriodicHistoryAction $buildPeriodicHistory,
        private readonly ComplianceAnchorResolver $anchorResolver,
    ) {}

    public function execute(?string $companyId, bool $bypassCompanyScope = false): ?Journey
    {
        $journeyQuery = Journey::query();
        if ($bypassCompanyScope) {
            $journeyQuery->withoutGlobalScope('company');
        }

        $journey = $journeyQuery
            ->where('company_id', $companyId)
            ->with(['company', 'journeyTemplate.levels.milestones.completions'])
            ->first();

        if (! $journey) {
            return null;
        }

        $this->attachDocumentTemplates($journey, $companyId);

        return $journey;
    }

    private function attachDocumentTemplates(Journey $journey, ?string $companyId): void
    {
        $milestones = $journey->journeyTemplate->levels->flatMap(fn (JourneyLevel $level) => $level->milestones);
        $milestoneIds = $milestones->pluck('id');

        // Global (company_id null) docs apply to every company on this
        // journey; a company_id match surfaces only that one company's own
        // extra requirements — never another company's.
        $templates = DocumentTemplate::query()
            ->whereIn('milestone_id', $milestoneIds)
            ->where(fn ($query) => $query->whereNull('company_id')->orWhere('company_id', $companyId))
            ->orderBy('sort_order')
            ->get();

        // One query, every row (not just the latest) — the rest of each
        // group beyond ->first() is exactly the compliance history
        // (rejected/expired/superseded uploads) the documents migration's
        // own comment already promises is retained, just never surfaced
        // until now. Splitting latest/history from this single fetch avoids
        // a second query for the same data.
        //
        // ->latest('id'), not ->latest() (created_at) — that column has no
        // sub-second precision, so two documents created in the same second
        // tie and the DB can return either one first, silently showing a
        // stale row as "current" and misfiling the real current one into
        // history. ULIDs sort correctly at far finer resolution.
        $documentsByTemplate = Document::query()->withoutGlobalScope('company')
            ->where('company_id', $companyId)
            ->whereIn('document_template_id', $templates->pluck('id'))
            ->latest('id')
            ->get()
            ->groupBy('document_template_id');

        /** @var Company $company */
        $company = $journey->company;

        $templates->each(function (DocumentTemplate $template) use ($documentsByTemplate, $company, $journey) {
            $docs = $documentsByTemplate->get($template->id, collect());
            $template->setAttribute('latest_document', $docs->first());

            if ($template->recurrence_type->isPeriodic()) {
                $anchor = $this->anchorResolver->resolve($company, $journey, $template);

                $template->setAttribute('history_documents', $this->buildPeriodicHistory->execute(
                    $template->recurrence_type,
                    $anchor,
                    $docs,
                ));
            } else {
                // Every upload for this checklist item that isn't the
                // current one — rejected attempts, expired past windows,
                // etc. Normalized into the same PeriodHistoryEntry shape the
                // periodic branch above produces, so JourneyResource has one
                // uniform history shape regardless of recurrence type.
                $template->setAttribute('history_documents', $docs->slice(1)->values()->map(
                    fn (Document $document) => new PeriodHistoryEntry(
                        document: $document,
                        periodKey: null,
                        isMissing: false,
                        isCurrent: false,
                    ),
                ));
            }
        });

        $templatesByMilestone = $templates->groupBy('milestone_id');

        $milestones->each(function (Milestone $milestone) use ($templatesByMilestone) {
            // setRelation (not setAttribute) so Milestone::documentTemplates()'s
            // real HasMany<DocumentTemplate> return type is what the Resource
            // sees — lets Scramble infer the array shape from the relation
            // itself instead of an untyped dynamic attribute. nestFlat runs
            // after latest_document is already set on every node above, so
            // that attribute survives being regrouped into a tree.
            $flatForMilestone = $templatesByMilestone->get($milestone->id, collect());
            $milestone->setRelation('documentTemplates', DocumentTemplate::nestFlat($flatForMilestone));
        });
    }
}
