<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Journey;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJourneyTemplateRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'country_code' => [
                'required', 'string', 'size:2',
                Rule::unique('journey_templates', 'country_code')->where('industry_id', $this->input('industry_id')),
            ],
            'industry_id' => ['required', 'string', 'exists:industries,id'],
            'name' => ['required', 'string', 'max:255'],
            'name_kh' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
