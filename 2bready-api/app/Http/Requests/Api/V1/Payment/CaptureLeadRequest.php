<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Payment;

use Illuminate\Foundation\Http\FormRequest;

class CaptureLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Public endpoint — a lead may come from an anonymous marketing-site visitor,
        // not just an authenticated company_owner hitting an in-app paywall.
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'source' => ['sometimes', 'string', 'max:30'],
        ];
    }
}
