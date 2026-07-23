<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Jobs\ScanDocumentForMalwareJob;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\User\Models\User;
use Illuminate\Http\UploadedFile;

class UploadDocumentAction
{
    public function execute(Company $company, DocumentTemplate $template, UploadedFile $file, User $uploadedBy, ?string $periodKey = null): Document
    {
        // MIME + size are already validated by StoreDocumentRequest before this
        // runs (CLAUDE.md: "validate MIME + size first, antivirus scan before
        // persisting"). Stored on config('filesystems.documents_disk') — local
        // for now (no S3 credentials provisioned yet), s3 once they are —
        // never a public bucket either way. See config/filesystems.php.
        $path = $file->store("documents/{$company->id}", config('filesystems.documents_disk'));

        $document = Document::create([
            'company_id' => $company->id,
            'document_template_id' => $template->id,
            'uploaded_by_user_id' => $uploadedBy->id,
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? $file->getClientMimeType(),
            'size_bytes' => $file->getSize() ?: 0,
            'status' => 'pending_scan',
            // Set only for a backfill upload (StoreDocumentRequest's
            // BackfillPeriodIsMissing rule already confirmed this is a real
            // missing period for this template+company) — null for a normal
            // upload, exactly as before, so VerifyDocumentAction still
            // derives the period from "now" for it.
            'period_key' => $periodKey,
        ]);

        ScanDocumentForMalwareJob::dispatch($document->id);

        return $document;
    }
}
