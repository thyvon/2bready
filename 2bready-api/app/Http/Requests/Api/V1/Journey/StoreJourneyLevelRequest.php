<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Journey;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJourneyLevelRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $journeyTemplate = $this->route('journeyTemplate');

        return [
            'code' => [
                'required', 'string', 'max:10',
                Rule::unique('journey_levels', 'code')->where('journey_template_id', $journeyTemplate->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'pathway_name' => ['required', 'string', 'max:255'],
            'pillar' => ['required', 'string', 'in:comply,scale,lead'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
