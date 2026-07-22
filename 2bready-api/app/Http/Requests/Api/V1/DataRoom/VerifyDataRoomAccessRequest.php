<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\DataRoom;

use Illuminate\Foundation\Http\FormRequest;

class VerifyDataRoomAccessRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'pin' => ['required', 'string', 'size:8'],
        ];
    }

    public function authorize(): bool
    {
        // Public endpoint — the PIN itself is the authorization check,
        // performed inside VerifyDataRoomAccessAction, not here.
        return true;
    }
}
