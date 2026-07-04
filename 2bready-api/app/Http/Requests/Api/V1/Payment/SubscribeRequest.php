<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Payment;

use Illuminate\Foundation\Http\FormRequest;

class SubscribeRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'package_id' => ['required', 'string', 'exists:packages,id'],
            'method' => ['required', 'string', 'in:stripe,manual_bank_transfer'],
        ];
    }
}
