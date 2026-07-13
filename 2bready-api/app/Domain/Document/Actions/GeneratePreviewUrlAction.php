<?php

declare(strict_types=1);

namespace App\Domain\Document\Actions;

use App\Domain\Document\Models\Document;
use Illuminate\Support\Facades\Storage;

/**
 * The `local` disk is private (storage/app/private, never a public bucket —
 * see CLAUDE.md's file-upload rule), so a document is never served by a
 * plain URL. Laravel 11's `serve => true` local-disk config registers a
 * signed route for it, and `temporaryUrl()` signs + time-limits a link to
 * that route — same API shape as an S3 disk would use, just backed by the
 * local filesystem in dev.
 */
class GeneratePreviewUrlAction
{
    public function execute(Document $document): string
    {
        return Storage::disk('local')->temporaryUrl(
            $document->file_path,
            now()->addMinutes(5),
        );
    }
}
