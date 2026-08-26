<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\SignOff;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendSignoffDocumentRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['required', 'string', Rule::exists('users', 'id')],
        ];
    }
}
