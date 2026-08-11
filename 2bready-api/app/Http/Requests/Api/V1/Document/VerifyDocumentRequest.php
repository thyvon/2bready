<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Document;

use Illuminate\Foundation\Http\FormRequest;

class VerifyDocumentRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'comment' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
