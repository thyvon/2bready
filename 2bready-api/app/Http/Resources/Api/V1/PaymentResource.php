<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Payment\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'subscription_id' => $this->subscription_id,
            'amount_cents' => $this->amount_cents,
            'currency' => $this->currency,
            'method' => $this->method,
            'status' => $this->status,
            'gateway_reference' => $this->gateway_reference,
            'submitted_at' => $this->submitted_at,
            'confirmed_at' => $this->confirmed_at,
            'created_at' => $this->created_at,
        ];
    }
}
