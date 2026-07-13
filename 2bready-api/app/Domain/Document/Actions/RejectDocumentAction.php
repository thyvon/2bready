<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\Models\Document;

class RejectDocumentAction
{
    public function execute(Document $document, string $reason): Document
    {
        $document->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $document;
    }
}
