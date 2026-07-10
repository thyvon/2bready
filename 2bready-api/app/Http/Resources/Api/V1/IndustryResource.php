<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Industry\Models\Industry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Industry */
class IndustryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'name_kh' => $this->name_kh,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
