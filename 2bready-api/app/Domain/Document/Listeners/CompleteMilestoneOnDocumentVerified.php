<?php

declare(strict_types=1);

namespace App\Domain\Document\Listeners;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Enums\DocumentStatus;
use App\Domain\Document\Events\DocumentVerified;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Actions\CompleteMilestoneAction;
use App\Domain\Journey\Enums\MilestoneCompletionTrigger;

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
    public function __construct(private readonly CompleteMilestoneAction $completeMilestoneAction) {}

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
        $requiredTemplateIds = DocumentTemplate::query()
            ->where('milestone_id', $milestoneId)
            ->where('is_required', true)
            ->where(fn ($query) => $query->whereNull('company_id')->orWhere('company_id', $document->company_id))
            ->pluck('id');

        if ($requiredTemplateIds->isEmpty()) {
            return;
        }

        $allVerified = $requiredTemplateIds->every(function (string $templateId) use ($document) {
            // ->latest('id'), not ->latest() (created_at) — the column has
            // no sub-second precision, so two documents created in the same
            // second tie and Postgres can return either row first. ULIDs
            // are lexicographically sortable at far finer resolution, so
            // ordering by id is the only way to reliably get the true
            // latest row.
            $latest = Document::query()
                ->where('company_id', $document->company_id)
                ->where('document_template_id', $templateId)
                ->latest('id')
                ->first();

            return $latest?->status === DocumentStatus::Verified;
        });

        if (! $allVerified) {
            return;
        }

        $milestone = $document->documentTemplate->milestone;

        /** @var Company $company */
        $company = $document->company;

        $this->completeMilestoneAction->execute(
            $company,
            $milestone,
            null,
            MilestoneCompletionTrigger::DocumentUpload,
        );
    }
}
