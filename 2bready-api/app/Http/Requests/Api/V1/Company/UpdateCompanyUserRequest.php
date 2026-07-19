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
            'google_auth_enabled' => ['sometimes', 'boolean'],
            // Tri-state override of User::requiresTwoFactor()'s role-derived default
            // (null keeps that default — company_owner/member are never required by
            // default; true forces 2FA on for this specific account).
            'two_factor_required' => ['sometimes', 'nullable', 'boolean'],
        ];
    }
}
