<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\Events\DocumentVerified;
use App\Domain\Document\Models\Document;
use App\Domain\User\Models\User;

class VerifyDocumentAction
{
    public function execute(Document $document, User $verifiedBy, ?string $comment = null): Document
    {
        $template = $document->documentTemplate;
        $recurrence = $template->recurrence_type;
        $verifiedAt = now();

        // A backfilled document already has its target period_key set at
        // upload time (see UploadDocumentAction) — respect it instead of
        // deriving "now" as the period, which would wrongly stamp a
        // historical filing as the current one. Its expiry must likewise
        // come from that period's own calendar boundary, not from today.
        $periodKey = $document->period_key ?? $recurrence->periodKeyFor($verifiedAt);
        $referenceDate = $document->period_key
            ? $recurrence->referenceDateForPeriod($document->period_key)
            : $verifiedAt;

        // expires_at and period_key both derive from the template's
        // recurrence type — see RecurrenceType. One-time docs get neither;
        // rolling gets an expiry but no period; periodic gets both. Keeping
        // the derivation in the enum (not inline here) means this action,
        // the expiry job, and BuildPeriodicHistoryAction all agree on the
        // same rules.
        $document->update([
            'status' => 'verified',
            'comment' => $comment,
            'verified_by_user_id' => $verifiedBy->id,
            'verified_at' => $verifiedAt, // real audit fact — always "now," never faked for a backfill
            'period_key' => $periodKey,
            'expires_at' => $recurrence->expiresAtFor($referenceDate, $template->expiry_months),
        ]);

        event(new DocumentVerified($document));

        return $document;
    }
}
