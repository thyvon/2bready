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
        // getAttributes() (raw array), not getAttribute() — the latter throws
        // under Model::shouldBeStrict() when the controller never called
        // setAttribute('latest_document', ...), which is now a real case
        // (the journey-template admin CRUD endpoints reuse this Resource
        // without that manual attribute).
        /** @var Document|null $latestDocument */
        $latestDocument = $this->resource->getAttributes()['latest_document'] ?? null;

        return [
            'id' => $this->id,
            'milestone_id' => $this->milestone_id,
            'parent_id' => $this->parent_id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'description' => $this->description,
            'is_required' => $this->is_required,
            'client_can_add_subdocs' => $this->client_can_add_subdocs,
            'recurrence_type' => $this->recurrence_type->value,
            'expiry_months' => $this->expiry_months,
            'effective_since' => $this->effective_since,
            'sort_order' => $this->sort_order,
            'latest_document' => $latestDocument ? new DocumentResource($latestDocument) : null,
            'children' => DocumentTemplateResource::collection($this->whenLoaded('children')),
        ];
    }
}
