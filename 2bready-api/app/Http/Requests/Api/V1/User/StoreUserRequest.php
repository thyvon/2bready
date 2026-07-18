<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'roles' => ['required', 'array', 'min:1'],
            // Internal roles only — admin-portal is back-office only, company_owner/
            // company_member accounts are never created from here (client-portal
            // self-registration, or a future company_owner-side invite flow).
            'roles.*' => ['string', Rule::in(['admin', 'staff', 'finance', 'auditor'])],
        ];
    }
}
