<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Journey;

use App\Domain\Journey\Models\JourneyLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJourneyLevelRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var JourneyLevel $journeyLevel */
        $journeyLevel = $this->route('journeyLevel');

        return [
            'code' => [
                'sometimes', 'string', 'max:10',
                Rule::unique('journey_levels', 'code')
                    ->where('journey_template_id', $journeyLevel->journey_template_id)
                    ->ignore($journeyLevel->id),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'pathway_name' => ['sometimes', 'string', 'max:255'],
            'pillar' => ['sometimes', 'string', 'in:comply,scale,lead'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
