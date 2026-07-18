<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Journey\Models\JourneyLevel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin JourneyLevel */
class JourneyLevelResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'journey_template_id' => $this->journey_template_id,
            'code' => $this->code,
            'name' => $this->name,
            'pathway_name' => $this->pathway_name,
            'pillar' => $this->pillar,
            'sort_order' => $this->sort_order,
            'milestones' => MilestoneResource::collection($this->whenLoaded('milestones')),
        ];
    }
}
