<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Marketplace\Models\TpRating;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TpRating */
class TpRatingResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tp_hire_id' => $this->tp_hire_id,
            'tp_partner_id' => $this->tp_partner_id,
            'rating' => $this->rating,
            'review_text' => $this->review_text,
            'created_at' => $this->created_at,
        ];
    }
}
