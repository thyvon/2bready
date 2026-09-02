<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\SignOff\Enums\SignoffDocumentCategory;
use App\Domain\SignOff\Enums\SignoffDocumentStatus;
use App\Domain\SignOff\Models\SignoffDocument;
use App\Domain\SignOff\Models\SignoffDocumentUser;
use App\Domain\User\Models\User;
use Illuminate\Support\Collection;

/**
 * Sends a verified journey document to staff for read & acknowledge.
 * Creates a signoff_document record linked to the journey document,
 * then assigns the staff recipients.
 */
class SendJourneyDocumentToStaffAction
{
    /** @return Collection<int, SignoffDocumentUser> */
    public function execute(
        Document $document,
        Company $company,
        array $recipientUserIds,
        User $sender,
    ): Collection {
        // Create a signoff_document record linked to the journey document
        $signoffDoc = SignoffDocument::create([
            'company_id' => $company->id,
            'document_id' => $document->id,
            'category' => SignoffDocumentCategory::Other,
            'title' => $document->original_filename,
            'file_path' => $document->file_path,
            'original_filename' => $document->original_filename,
            'mime_type' => $document->mime_type,
            'size_bytes' => $document->size_bytes,
            'status' => SignoffDocumentStatus::Verified,
            'uploaded_by_user_id' => $sender->id,
            'verified_by_user_id' => $document->verified_by_user_id,
            'verified_at' => $document->verified_at,
        ]);

        // Assign staff recipients
        $rows = collect();
        foreach ($recipientUserIds as $userId) {
            $rows->push(SignoffDocumentUser::create([
                'signoff_document_id' => $signoffDoc->id,
                'user_id' => $userId,
                'emailed_at' => now(),
            ]));
        }

        return $rows;
    }
}
