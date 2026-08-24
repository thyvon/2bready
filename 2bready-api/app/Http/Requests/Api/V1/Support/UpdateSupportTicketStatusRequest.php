<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Support;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupportTicketStatusRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            // resolve/close are the team's moves; reopen is the company's.
            'status' => ['required', 'string', Rule::in(['open', 'pending', 'resolved', 'closed'])],
        ];
    }
}
