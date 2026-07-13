<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Package\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Package */
class PackageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_kh' => $this->name_kh,
            'description' => $this->description,
            'price_cents' => $this->price_cents,
            'industry_id' => $this->industry_id,
            'industry_code' => $this->whenLoaded('industry', fn () => $this->industry?->code),
            'journey_level_id' => $this->journey_level_id,
            'journey_level_code' => $this->whenLoaded('journeyLevel', fn () => $this->journeyLevel?->code),
            'billing_period' => $this->billing_period,
            'tier' => $this->tier,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
