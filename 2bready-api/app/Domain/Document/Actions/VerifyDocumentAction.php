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
        $expiryMonths = $document->documentTemplate->expiry_months;

        $document->update([
            'status' => 'verified',
            'verified_by_user_id' => $verifiedBy->id,
            'verified_at' => now(),
            'expires_at' => $expiryMonths ? now()->addMonths($expiryMonths) : null,
        ]);

        event(new DocumentVerified($document));

        return $document;
    }
}
