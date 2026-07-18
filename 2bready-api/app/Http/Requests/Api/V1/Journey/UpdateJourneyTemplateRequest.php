<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Journey;

use App\Domain\Journey\Models\JourneyTemplate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJourneyTemplateRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var JourneyTemplate $journeyTemplate */
        $journeyTemplate = $this->route('journeyTemplate');

        return [
            'country_code' => [
                'sometimes', 'string', 'size:2',
                Rule::unique('journey_templates', 'country_code')
                    ->where('industry_id', $this->input('industry_id', $journeyTemplate->industry_id))
                    ->ignore($journeyTemplate->id),
            ],
            'industry_id' => ['sometimes', 'string', 'exists:industries,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'name_kh' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
