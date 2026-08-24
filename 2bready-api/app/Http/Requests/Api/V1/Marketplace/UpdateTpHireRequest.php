<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Marketplace;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTpHireRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'journey_level' => ['required', 'string', Rule::in(['L1', 'L2', 'L3', 'L4'])],
        ];
    }
}
