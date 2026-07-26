<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Marketplace;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTpHireRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'company_id' => ['required', 'string', 'exists:companies,id'],
            'tp_partner_id' => ['required', 'string', 'exists:tp_partners,id'],
            'journey_level' => ['required', 'string', Rule::in(['L2', 'L3', 'L4'])],
            'method' => ['required', 'string', Rule::in(['manual_bank_transfer', 'stripe'])],
        ];
    }
}
