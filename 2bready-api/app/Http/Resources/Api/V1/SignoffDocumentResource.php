<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\SignOff\Models\SignoffDocument;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin SignoffDocument
 */
class SignoffDocumentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'category' => $this->category->value,
            'title' => $this->title,
            'original_filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'status' => $this->status->value,
            'rejection_comment' => $this->rejection_comment,
            'uploaded_by_user_id' => $this->uploaded_by_user_id,
            'verified_by_user_id' => $this->verified_by_user_id,
            'verifier_name' => $this->whenLoaded('verifier', fn () => $this->verifier?->name),
            'verified_at' => $this->verified_at?->toISOString(),
            // Signed preview URL for the browser — raw path would 404.
            'preview_url' => Storage::disk(config('filesystems.documents_disk'))
                ->temporaryUrl($this->file_path, now()->addMinutes(30)),
            'users' => SignoffDocumentUserResource::collection($this->whenLoaded('users')),
            'created_at' => $this->created_at,
        ];
    }
}
