<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Package;

use Illuminate\Foundation\Http\FormRequest;

class StorePackageRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'name_kh' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'monthly_price_cents' => ['required', 'integer', 'min:0'],
            'yearly_price_cents' => ['required', 'integer', 'min:0'],
            'audit_fee_cents' => ['required', 'integer', 'min:0'],
            'industry_id' => ['nullable', 'string', 'exists:industries,id'],
            'journey_level_id' => ['nullable', 'string', 'exists:journey_levels,id'],
            'tier' => ['sometimes', 'string', 'in:free,pro,enterprise'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}