<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Package\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public-facing package resource for anonymous/unauthenticated consumers
 * (landing page pricing). Deliberately narrower than PackageResource —
 * no timestamps, soft-delete state, or other internal metadata.
 *
 * @mixin Package
 */
class PublicPackageResource extends JsonResource
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
            'industry_code' => $this->whenLoaded('industry', fn () => $this->industry?->code),
            'journey_level_code' => $this->whenLoaded('journeyLevel', fn () => $this->journeyLevel?->code),
            'billing_period' => $this->billing_period,
            'tier' => $this->tier,
            'sort_order' => $this->sort_order,
        ];
    }
}
