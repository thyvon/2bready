<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Document;

use App\Domain\Document\Enums\RecurrenceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentTemplateRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_required' => ['sometimes', 'boolean'],
            'client_can_add_subdocs' => ['sometimes', 'boolean'],
            'recurrence_type' => ['sometimes', Rule::enum(RecurrenceType::class)],
            'expiry_months' => ['nullable', 'integer', 'min:1'],
            'effective_since' => ['sometimes', 'nullable', 'date'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
