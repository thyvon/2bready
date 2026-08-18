<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Audit;

use Illuminate\Foundation\Http\FormRequest;

class StoreAuditRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'tp_hire_id' => ['required', 'string', 'exists:tp_hires,id'],
            'deadline' => ['nullable', 'date', 'after:today'],
        ];
    }
}
