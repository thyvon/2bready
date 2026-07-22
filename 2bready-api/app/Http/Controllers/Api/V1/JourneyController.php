<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Actions\BuildPeriodicHistoryAction;
use App\Domain\Document\DTOs\PeriodHistoryEntry;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Actions\CompleteMilestoneAction;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\Milestone;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\JourneyResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JourneyController extends Controller
{
    public function __construct(private readonly BuildPeriodicHistoryAction $buildPeriodicHistory) {}

    // The caller's own company's journey — no {company} param, since a
    // company_owner/member always views their own, never picks one by ID.
    public function show(Request $request): JsonResponse
    {
        $this->authorize('view', Journey::class);

        return $this->journeyResponse($request->user()->current_company_id);
    }

    // Back-office view — staff looks up a specific company's progress before
    // deciding what to sign off. A company_owner/member hitting this with
    // someone else's company ID still gets nothing: Journey::BelongsToCompany
    // scopes the query to their own current_company_id regardless of which
    // {company} was requested, same as every other tenant-scoped lookup.
    public function showForCompany(Company $company): JsonResponse
    {
        $this->authorize('view', Journey::class);

        return $this->journeyResponse($company->id);
    }

    // Week-1 admin-signoff completion — see CompleteMilestoneAction.
    public function completeMilestone(Company $company, Milestone $milestone, Request $request, CompleteMilestoneAction $action): JsonResponse
    {
        $this->authorize('complete', Journey::class);

        $completion = $action->execute($company, $milestone, $request->user());

        return ApiResponse::created([
            'id' => $completion->id,
            'milestone_id' => $completion->milestone_id,
            'completed_at' => $completion->completed_at,
            'trigger' => $completion->trigger,
        ]);
    }

    private function journeyResponse(?string $companyId): JsonResponse
    {
        $journey = Journey::query()
            ->where('company_id', $companyId)
            ->with(['company', 'journeyTemplate.levels.milestones.completions'])
            ->first();

        if (! $journey) {
            return ApiResponse::error('No journey found for this company.', [], 404);
        }

        $this->attachDocumentTemplates($journey, $companyId);

        return ApiResponse::success(new JourneyResource($journey));
    }

    /**
     * Combines Document domain data into the Journey response for the
     * client's convenience — one call gets the whole Level > Milestone >
     * Document taxonomy with real per-document status, matching the shape
     * client-portal's journey-data.ts mock already expects. Attached as a
     * dynamic `document_templates` attribute per milestone (mirrors
     * DocumentController::templates()'s `latest_document` pattern) rather
     * than a real Eloquent relation, since Journey's Milestone model
     * shouldn't need to know Document domain exists.
     */
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
        $documentsByTemplate = Document::query()
            ->where('company_id', $companyId)
            ->whereIn('document_template_id', $templates->pluck('id'))
            ->latest('id')
            ->get()
            ->groupBy('document_template_id');

        // A document requirement can't have a "missing" period before the
        // journey was activated (activated_at is nullable — an unactivated
        // journey anchors on now(), i.e. nothing owed yet) or before the
        // requirement itself existed.
        $journeyActivatedAt = $journey->activated_at ?? now();

        $templates->each(function (DocumentTemplate $template) use ($documentsByTemplate, $journeyActivatedAt) {
            $docs = $documentsByTemplate->get($template->id, collect());
            $template->setAttribute('latest_document', $docs->first());

            if ($template->recurrence_type->isPeriodic()) {
                $anchor = $template->created_at->greaterThan($journeyActivatedAt)
                    ? $template->created_at
                    : $journeyActivatedAt;

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
