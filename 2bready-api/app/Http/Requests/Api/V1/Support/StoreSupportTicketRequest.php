<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Support;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupportTicketRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'category' => ['required', 'string', Rule::in(['general', 'billing', 'technical', 'consultation'])],
            'subject' => ['required', 'string', 'min:3', 'max:255'],
            // The opening post of the thread.
            'message' => ['required', 'string', 'min:1', 'max:5000'],
        ];
    }
}
