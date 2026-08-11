<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\Models\Document;
use App\Domain\User\Models\User;

class RejectDocumentAction
{
    public function execute(Document $document, string $reason, User $rejectedBy): Document
    {
        $document->update([
            'status' => 'rejected',
            'comment' => $reason,
            'rejected_by_user_id' => $rejectedBy->id,
        ]);

        return $document;
    }
}
