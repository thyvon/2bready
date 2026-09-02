<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\SignOff\Models\SignoffDocumentUser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SignoffDocumentUser
 */
class SignoffDocumentUserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'signoff_document_id' => $this->signoff_document_id,
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'emailed_at' => $this->emailed_at?->toISOString(),
            'signed_at' => $this->signed_at?->toISOString(),
            'document' => $this->whenLoaded('document', fn () => new SignoffDocumentResource($this->document)),
        ];
    }
}
