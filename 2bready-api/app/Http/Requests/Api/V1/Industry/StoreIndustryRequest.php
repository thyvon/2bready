<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Industry;

use Illuminate\Foundation\Http\FormRequest;

class StoreIndustryRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:industries,code'],
            'name' => ['required', 'string', 'max:255'],
            'name_kh' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
