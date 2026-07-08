<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public-facing package resource for anonymous/unauthenticated consumers
 * (landing page pricing). Deliberately narrower than PackageResource —
 * no timestamps, soft-delete state, or other internal metadata.
 */
class PublicPackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_kh' => $this->name_kh,
            'description' => $this->description,
            'price_cents' => $this->price_cents,
            'billing_period' => $this->billing_period,
            'sort_order' => $this->sort_order,
        ];
    }
}