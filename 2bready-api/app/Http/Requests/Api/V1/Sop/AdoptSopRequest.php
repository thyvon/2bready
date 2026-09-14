<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Sop;

use Illuminate\Foundation\Http\FormRequest;

class AdoptSopRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'staff', 'company_owner']) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'override_content_en' => ['nullable', 'string'],
            'override_content_kh' => ['nullable', 'string'],
        ];
    }
}
