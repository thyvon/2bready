<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Industry;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIndustryRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('industries', 'code')->ignore($this->route('industry'))],
            'name' => ['sometimes', 'string', 'max:255'],
            'name_kh' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
