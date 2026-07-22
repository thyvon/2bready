<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\Events\DocumentVerified;
use App\Domain\Document\Models\Document;
use App\Domain\User\Models\User;

class VerifyDocumentAction
{
    public function execute(Document $document, User $verifiedBy): Document
    {
        $template = $document->documentTemplate;
        $recurrence = $template->recurrence_type;
        $verifiedAt = now();

        // expires_at and period_key both derive from the template's
        // recurrence type — see RecurrenceType. One-time docs get neither;
        // rolling gets an expiry but no period; periodic gets both. Keeping
        // the derivation in the enum (not inline here) means this action,
        // the expiry job, and BuildPeriodicHistoryAction all agree on the
        // same rules.
        $document->update([
            'status' => 'verified',
            'verified_by_user_id' => $verifiedBy->id,
            'verified_at' => $verifiedAt,
            'period_key' => $recurrence->periodKeyFor($verifiedAt),
            'expires_at' => $recurrence->expiresAtFor($verifiedAt, $template->expiry_months),
        ]);

        event(new DocumentVerified($document));

        return $document;
    }
}
