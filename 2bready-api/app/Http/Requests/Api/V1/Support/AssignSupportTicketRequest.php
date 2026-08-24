<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Support;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignSupportTicketRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            // Null clears the assignment.
            'assigned_to' => ['nullable', 'string', Rule::exists('users', 'id')],
        ];
    }
}
