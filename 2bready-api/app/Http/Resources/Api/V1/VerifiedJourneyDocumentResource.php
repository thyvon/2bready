<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Document\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Verified journey document surfaced in the signoff-document picker.
 * Includes a signed preview_url so the frontend can render a preview
 * without a separate endpoint.
 *
 * @mixin Document
 */
class VerifiedJourneyDocumentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'original_filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'status' => $this->status->value,
            'verified_at' => $this->verified_at?->toISOString(),
            'comment' => $this->comment,
            'document_template' => $this->whenLoaded('documentTemplate', function () {
                return [
                    'id' => $this->documentTemplate->id,
                    'name' => $this->documentTemplate->name,
                ];
            }),
            'preview_url' => Storage::disk(config('filesystems.documents_disk'))
                ->temporaryUrl($this->file_path, now()->addMinutes(30)),
        ];
    }
}
