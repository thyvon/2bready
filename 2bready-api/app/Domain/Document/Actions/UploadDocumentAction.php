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
    public function execute(Company $company, DocumentTemplate $template, UploadedFile $file, User $uploadedBy): Document
    {
        // MIME + size are already validated by StoreDocumentRequest before this
        // runs (CLAUDE.md: "validate MIME + size first, antivirus scan before
        // persisting"). Stored on the private disk — signed URLs only, never
        // a public bucket.
        $path = $file->store("documents/{$company->id}", 'local');

        $document = Document::create([
            'company_id' => $company->id,
            'document_template_id' => $template->id,
            'uploaded_by_user_id' => $uploadedBy->id,
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? $file->getClientMimeType(),
            'size_bytes' => $file->getSize() ?: 0,
            'status' => 'pending_scan',
        ]);

        ScanDocumentForMalwareJob::dispatch($document->id);

        return $document;
    }
}
