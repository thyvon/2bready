<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Actions;

use App\Domain\SignOff\Enums\SignoffDocumentStatus;
use App\Domain\SignOff\Models\SignoffDocument;
use App\Domain\User\Models\User;
use Illuminate\Support\Facades\Storage;

/**
 * The internal expert verdict on an uploaded document: verified (may be
 * sent to staff) or rejected (with a comment the owner can act on).
 */
class ReviewSignoffDocumentAction
{
    public function verify(SignoffDocument $document, User $verifier): SignoffDocument
    {
        $document->update([
            'status' => SignoffDocumentStatus::Verified,
            'verified_by_user_id' => $verifier->id,
            'verified_at' => now(),
            'rejection_comment' => null,
        ]);

        return $document->fresh();
    }

    public function reject(SignoffDocument $document, User $verifier, string $comment): SignoffDocument
    {
        $document->update([
            'status' => SignoffDocumentStatus::Rejected,
            'verified_by_user_id' => $verifier->id,
            'verified_at' => null,
            'rejection_comment' => $comment,
        ]);

        return $document->fresh();
    }

    /** File cleanup for a deleted document (owner removal). */
    public function deleteFile(SignoffDocument $document): void
    {
        Storage::disk(config('filesystems.documents_disk'))->delete($document->file_path);
    }
}
