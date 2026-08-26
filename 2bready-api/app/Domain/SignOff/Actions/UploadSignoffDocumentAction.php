<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\SignOff\Enums\SignoffDocumentStatus;
use App\Domain\SignOff\Jobs\ScanSignoffDocumentJob;
use App\Domain\SignOff\Models\SignoffDocument;
use App\Domain\User\Models\User;

/**
 * Stores an uploaded sign-off document for the company and queues its
 * malware scan (same honest-stub shape as Document's scanner).
 */
class UploadSignoffDocumentAction
{
    public function execute(
        Company $company,
        User $uploader,
        string $category,
        string $title,
        string $filePath,
        string $originalFilename,
        string $mimeType,
        int $sizeBytes,
    ): SignoffDocument {
        $document = SignoffDocument::create([
            'company_id' => $company->id,
            'uploaded_by_user_id' => $uploader->id,
            'category' => $category,
            'title' => $title,
            'file_path' => $filePath,
            'original_filename' => $originalFilename,
            'mime_type' => $mimeType,
            'size_bytes' => $sizeBytes,
            'status' => SignoffDocumentStatus::PendingReview,
        ]);

        ScanSignoffDocumentJob::dispatch($document->id);

        return $document;
    }
}
