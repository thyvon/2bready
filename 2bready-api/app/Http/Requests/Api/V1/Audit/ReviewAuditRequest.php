<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Audit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewAuditRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'decision' => ['required', 'string', Rule::in(['approved', 'rejected'])],
        ];
    }
}
