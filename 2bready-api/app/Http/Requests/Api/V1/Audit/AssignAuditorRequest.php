<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Audit;

use Illuminate\Foundation\Http\FormRequest;

class AssignAuditorRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'auditor_id' => ['required', 'string', 'exists:auditors,id'],
        ];
    }
}
