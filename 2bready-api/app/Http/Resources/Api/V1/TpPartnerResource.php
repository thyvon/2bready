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
            'created_at' => $this->created_at,
        ];
    }
}
