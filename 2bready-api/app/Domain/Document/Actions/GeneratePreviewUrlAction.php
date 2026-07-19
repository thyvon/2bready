<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\Models\Document;
use Illuminate\Support\Facades\Storage;

/**
 * Reads config('filesystems.documents_disk') — same disk UploadDocumentAction
 * wrote to (local for now, s3 once real credentials exist — see
 * config/filesystems.php). Either way a document is never served by a plain
 * URL: Laravel 11's `serve => true` local-disk config registers a signed
 * route for temporaryUrl() to use, and S3's temporaryUrl() is a native
 * presigned URL — same API shape, never a public bucket.
 */
class GeneratePreviewUrlAction
{
    public function execute(Document $document): string
    {
        return Storage::disk(config('filesystems.documents_disk'))->temporaryUrl(
            $document->file_path,
            now()->addMinutes(5),
        );
    }
}
