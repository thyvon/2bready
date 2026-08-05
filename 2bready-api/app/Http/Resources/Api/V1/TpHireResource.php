<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\TpPartner\Models\TpPartner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TpHire */
class TpHireResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company' => $this->whenLoaded('company', function () {
                /** @var Company $company */
                $company = $this->company;

                return ['id' => $company->id, 'name' => $company->name];
            }),
            'tp_partner_id' => $this->tp_partner_id,
            'tp_partner' => $this->whenLoaded('tpPartner', function () {
                /** @var TpPartner $tpPartner */
                $tpPartner = $this->tpPartner;

                return ['id' => $tpPartner->id, 'name' => $tpPartner->name];
            }),
            'journey_level' => $this->journey_level,
            'price_agreed_cents' => $this->price_agreed_cents,
            'platform_commission_cents' => $this->platform_commission_cents,
            'tp_payout_cents' => $this->tp_payout_cents,
            'status' => $this->status,
            'payout_status' => $this->payout_status,
            'hired_at' => $this->hired_at,
            'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at,
            'rating' => $this->whenLoaded('rating', function () {
                return $this->rating ? new TpRatingResource($this->rating) : null;
            }),
            'created_at' => $this->created_at,
        ];
    }
}
