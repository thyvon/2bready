<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Company;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyUserRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', 'in:active,suspended,inactive'],
            'role' => ['sometimes', 'string', Rule::in(['company_owner', 'company_member'])],
        ];
    }
}
