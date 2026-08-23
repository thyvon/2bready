<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Journey\Models\Milestone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Milestone */
class MilestoneResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'journey_level_id' => $this->journey_level_id,
            'name' => $this->name,
            'description' => $this->description,
            'sort_order' => $this->sort_order,
            'document_templates' => DocumentTemplateResource::collection($this->whenLoaded('documentTemplates')),
        ];
    }
}
