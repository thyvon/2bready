<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\TpPartner;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Firm self-service slice of a TP partner (Sprint 7) — the three per-level
 * prices only. Unlike UpdateTpPartnerRequest this deliberately carries no
 * name/status fields: a firm's own auditors must never be able to rename or
 * suspend themselves through this endpoint.
 */
class UpdateTpPartnerPricingRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'price_l2_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'price_l3_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'price_l4_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'price_l1_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }
}
