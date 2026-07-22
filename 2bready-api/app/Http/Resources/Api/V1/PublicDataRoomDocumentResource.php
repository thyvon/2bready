<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Document\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Deliberately minimal — an external viewer (bank/investor) never sees
 * file_path, status, or any internal metadata, only what they need to pick
 * a document to preview. `name` comes from the DocumentTemplate (the
 * checklist item's real name, e.g. "Audited Financial Statement"), not the
 * raw uploaded filename — see VerifyDataRoomAccessAction's eager-load.
 *
 * @mixin Document
 */
class PublicDataRoomDocumentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->documentTemplate->name,
            'mime_type' => $this->mime_type,
        ];
    }
}
