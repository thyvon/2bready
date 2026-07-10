<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Industry\Models\Industry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public-facing industry resource for anonymous/unauthenticated consumers
 * (e.g. client-portal's onboarding wizard, which has no auth session yet
 * at that point). Deliberately narrower than IndustryResource — no
 * description, is_active, timestamps, or other internal metadata.
 *
 * @mixin Industry
 */
class PublicIndustryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'name_kh' => $this->name_kh,
            'sort_order' => $this->sort_order,
        ];
    }
}
