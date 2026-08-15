<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Package;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePackageRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'name_kh' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'monthly_price_cents' => ['sometimes', 'integer', 'min:0'],
            'yearly_price_cents' => ['sometimes', 'integer', 'min:0'],
            'audit_fee_cents' => ['sometimes', 'integer', 'min:0'],
            'industry_id' => ['sometimes', 'nullable', 'string', 'exists:industries,id'],
            'journey_level_id' => ['sometimes', 'nullable', 'string', 'exists:journey_levels,id'],
            'tier' => ['sometimes', 'string', 'in:free,pro,enterprise'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}