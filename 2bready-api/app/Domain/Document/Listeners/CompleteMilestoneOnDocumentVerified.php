<?php

declare(strict_types=1);

namespace App\Domain\Document\Listeners;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Actions\BuildPeriodicHistoryAction;
use App\Domain\Document\Enums\DocumentStatus;
use App\Domain\Document\Events\DocumentVerified;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Document\Services\ComplianceAnchorResolver;
use App\Domain\Journey\Actions\CompleteMilestoneAction;
use App\Domain\Journey\Enums\MilestoneCompletionTrigger;
use App\Domain\Journey\Models\Journey;

/**
 * This is Journey's deferred "Week 2" automated trigger, now real: a
 * milestone completes itself (trigger: document_upload) once every one of
 * its required documents is verified for the company — no admin-signoff
 * needed for milestones with real documents. Cross-domain on purpose (event
 * in Document, listener calls Journey's own Action) rather than Document
 * calling into Journey's models directly — see CLAUDE.md's event/listener
 * rule.
 */
class CompleteMilestoneOnDocumentVerified
{
    public function __construct(
        private readonly CompleteMilestoneAction $completeMilestoneAction,
        private readonly BuildPeriodicHistoryAction $buildPeriodicHistory,
        private readonly ComplianceAnchorResolver $anchorResolver,
    ) {}

    public function handle(DocumentVerified $event): void
    {
        $document = $event->document;
        $milestoneId = $document->documentTemplate->milestone_id;

        // Global docs count toward every company's completion; a company_id
        // match only counts for that one company — without this, one
        // company's private extra requirement would block (or count toward)
        // every other company sharing this milestone. Nested sub-documents
        // already count correctly with no extra handling here: they retain
        // their ancestor's milestone_id regardless of nesting depth.
        $requiredTemplates = DocumentTemplate::query()
            ->where('milestone_id', $milestoneId)
            ->where('is_required', true)
            ->where(fn ($query) => $query->whereNull('company_id')->orWhere('company_id', $document->company_id))
            ->get();

        if ($requiredTemplates->isEmpty()) {
            return;
        }

        /** @var Company $company */
        $company = $document->company;
        $journey = Journey::query()->where('company_id', $document->company_id)->first();

        $allSatisfied = $requiredTemplates->every(function (DocumentTemplate $template) use ($document, $company, $journey) {
            // ->latest('id'), not ->latest() (created_at) — the column has
            // no sub-second precision, so two documents created in the same
            // second tie and Postgres can return either row first. ULIDs
            // are lexicographically sortable at far finer resolution, so
            // ordering by id is the only way to reliably get the true
            // latest row.
            $query = Document::query()
                ->where('company_id', $document->company_id)
                ->where('document_template_id', $template->id)
                ->latest('id');

            if (! $template->recurrence_type->isPeriodic()) {
                return $query->first()?->status === DocumentStatus::Verified;
            }

            // Periodic templates need every row, not just the latest, to
            // diff "owed" against "filed" — fetched only for this branch so
            // the common one_time/rolling path stays a single cheap
            // latest-only query.
            $documents = $query->get();

            if ($documents->first()?->status !== DocumentStatus::Verified) {
                return false;
            }

            // A periodic template isn't satisfied by a verified *latest*
            // upload alone — a real unfilled historical gap (e.g. a missing
            // 2023, once compliance_start_date reveals it) blocks
            // completion the same way an unverified current period would.
            $anchor = $this->anchorResolver->resolve($company, $journey, $template);
            $history = $this->buildPeriodicHistory->execute($template->recurrence_type, $anchor, $documents);

            return $history->doesntContain(fn ($entry) => $entry->isMissing);
        });

        if (! $allSatisfied) {
            return;
        }

        $milestone = $document->documentTemplate->milestone;

        $this->completeMilestoneAction->execute(
            $company,
            $milestone,
            null,
            MilestoneCompletionTrigger::DocumentUpload,
        );
    }
}
