<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Audit;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAuditRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'score' => ['required', 'integer', 'min:0', 'max:100'],
            'feedback' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
