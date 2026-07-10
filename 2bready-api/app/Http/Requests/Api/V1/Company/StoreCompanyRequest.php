<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Company;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'name_kh' => ['nullable', 'string', 'max:255'],
            'registration_no' => ['nullable', 'string', 'max:100'],
            'employee_count' => ['nullable', 'integer', 'min:0'],
            'industry_id' => ['required', 'string', 'exists:industries,id'],
            'country_code' => ['sometimes', 'string', 'size:2'],
            'default_locale' => ['sometimes', 'string', 'in:en,kh'],
        ];
    }
}
