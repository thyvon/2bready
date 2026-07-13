<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * `latest_document` is set by the controller (whenLoaded-style manual
 * attribute, not a real Eloquent relation — "the current company's latest
 * document for this template" only makes sense scoped to one company at a
 * time, which isn't a plain hasMany).
 *
 * @mixin DocumentTemplate
 */
class DocumentTemplateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var Document|null $latestDocument */
        $latestDocument = $this->resource->getAttribute('latest_document');

        return [
            'id' => $this->id,
            'milestone_id' => $this->milestone_id,
            'name' => $this->name,
            'description' => $this->description,
            'is_required' => $this->is_required,
            'expiry_months' => $this->expiry_months,
            'sort_order' => $this->sort_order,
            'latest_document' => $latestDocument ? new DocumentResource($latestDocument) : null,
        ];
    }
}
