<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Sop;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'staff', 'company_owner']) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $isAdminOrStaff = $this->user()->hasAnyRole(['admin', 'staff']);

        return [
            'title' => ['required', 'string', 'max:255'],
            'version' => ['required', 'string', 'max:50'],
            'content_en' => ['required', 'string'],
            'content_kh' => ['nullable', 'string'],
            'effective_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'company_id' => [
                $isAdminOrStaff ? 'nullable' : 'prohibited',
                'ulid',
                Rule::exists('companies', 'id'),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'company_id.prohibited' => 'Only administrators may set company_id. Company owners create SOPs for their own company.',
        ];
    }
}
