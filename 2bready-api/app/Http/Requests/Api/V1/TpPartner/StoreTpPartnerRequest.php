<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\TpPartner;

use Illuminate\Foundation\Http\FormRequest;

class StoreTpPartnerRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'name_kh' => ['nullable', 'string', 'max:255'],
            'price_l2_cents' => ['nullable', 'integer', 'min:0'],
            'price_l3_cents' => ['nullable', 'integer', 'min:0'],
            'price_l4_cents' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
