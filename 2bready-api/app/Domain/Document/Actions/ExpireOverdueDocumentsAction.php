<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\Enums\DocumentStatus;
use App\Domain\Document\Events\DocumentExpired;
use App\Domain\Document\Models\Document;

/**
 * Runs daily (see ExpireOverdueDocumentsJob / routes/console.php). A
 * verified document whose expires_at has passed is no longer real evidence
 * of compliance — this is the only place DocumentStatus::Expired ever gets
 * set. RevertMilestoneCompletionOnDocumentExpired reacts to the fired event
 * to keep the journey/compliance state honest.
 */
class ExpireOverdueDocumentsAction
{
    public function execute(): int
    {
        $count = 0;

        // cursor(), not get() — this scans every company's documents, not
        // one company's, so there's no reason to hold them all in memory at
        // once (CLAUDE.md: performance is a standing priority).
        Document::query()
            ->where('status', DocumentStatus::Verified)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->cursor()
            ->each(function (Document $document) use (&$count): void {
                $document->update(['status' => DocumentStatus::Expired]);

                event(new DocumentExpired($document));

                $count++;
            });

        return $count;
    }
}
