<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Package\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Internal (admin/staff/finance) package view. Mirrors the public grouping:
 * each journey level is a single entry with its monthly + yearly prices
 * nested under `prices`, so the admin portal manages "one package, two price
 * options" instead of one row per billing period. The representative Package
 * row (the yearly one, falling back to whatever exists) supplies the shared
 * identity/name/tier fields.
 *
 * @mixin Package
 */
class PackageGroupResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_kh' => $this->name_kh,
            'description' => $this->description,
            'audit_fee_cents' => $this->audit_fee_cents,
            'industry_id' => $this->industry_id,
            'industry_code' => $this->whenLoaded('industry', fn () => $this->industry?->code),
            'journey_level_id' => $this->journey_level_id,
            'journey_level_code' => $this->whenLoaded('journeyLevel', fn () => $this->journeyLevel?->code),
            'tier' => $this->tier,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'prices' => PublicPackagePriceResource::collection($this->whenLoaded('prices', $this->prices ?? collect())),
        ];
    }
}
