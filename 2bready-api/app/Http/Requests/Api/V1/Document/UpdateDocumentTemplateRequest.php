<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Document;

use App\Domain\Document\Enums\RecurrenceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentTemplateRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'is_required' => ['sometimes', 'boolean'],
            'recurrence_type' => ['sometimes', Rule::enum(RecurrenceType::class)],
            'expiry_months' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
