<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\TpPartner;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTpPartnerRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'name_kh' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:active,suspended'],
            'price_l2_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'price_l3_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'price_l4_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }
}
