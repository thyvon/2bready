<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\TpPartner\Models\TpPartner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TpPartner */
class TpPartnerResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_kh' => $this->name_kh,
            'status' => $this->status,
            'price_l2_cents' => $this->price_l2_cents,
            'price_l3_cents' => $this->price_l3_cents,
            'price_l4_cents' => $this->price_l4_cents,
            'price_l1_cents' => $this->price_l1_cents,
            // Aggregates are computed on read (withAvg/withCount) — never
            // stored on tp_partners, so there is no denormalized number to
            // drift out of sync with tp_ratings. Keys are omitted unless the
            // query actually loaded the aggregates (avoids
            // MissingAttributeException on show/update/delete paths).
            'rating_avg' => $this->when(
                array_key_exists('ratings_avg_rating', $this->resource->getAttributes()),
                fn (): ?float => $this->ratings_avg_rating === null ? null : round((float) $this->ratings_avg_rating, 1),
            ),
            'rating_count' => $this->when(
                array_key_exists('ratings_count', $this->resource->getAttributes()),
                fn (): int => (int) ($this->ratings_count ?? 0),
            ),
            'created_at' => $this->created_at,
        ];
    }
}
