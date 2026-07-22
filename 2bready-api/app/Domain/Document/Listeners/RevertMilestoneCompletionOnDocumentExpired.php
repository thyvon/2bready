<?php

declare(strict_types=1);

namespace App\Domain\Document\Listeners;

use App\Domain\Document\Events\DocumentExpired;
use App\Domain\Journey\Models\MilestoneCompletion;

/**
 * The reverse of CompleteMilestoneOnDocumentVerified: a document leaving
 * Verified means "all required documents verified" is no longer true for
 * this milestone, full stop — no need to re-check every other required
 * document the way the completion listener does. MilestoneCompletion has
 * SoftDeletes, so this is a clean ->delete(); a later re-upload + re-verify
 * recreates the row naturally via the existing listener, no new
 * completion-side code needed for that half.
 */
class RevertMilestoneCompletionOnDocumentExpired
{
    public function handle(DocumentExpired $event): void
    {
        $document = $event->document;
        $milestoneId = $document->documentTemplate->milestone_id;

        MilestoneCompletion::query()
            ->where('company_id', $document->company_id)
            ->where('milestone_id', $milestoneId)
            ->delete();
    }
}
