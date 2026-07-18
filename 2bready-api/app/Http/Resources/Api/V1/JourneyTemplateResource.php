<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Journey\Models\JourneyTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin JourneyTemplate */
class JourneyTemplateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'country_code' => $this->country_code,
            'industry_id' => $this->industry_id,
            'industry_code' => $this->whenLoaded('industry', fn () => $this->industry?->code),
            'name' => $this->name,
            'name_kh' => $this->name_kh,
            'is_active' => $this->is_active,
            'levels' => JourneyLevelResource::collection($this->whenLoaded('levels')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
