<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\SignOff;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSignoffDocumentRequest extends FormRequest
{
    private const MAX_KB = 10 * 1024; // 10 MB, mirrors Document uploads

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'category' => ['required', 'string', Rule::in(['sales', 'marketing', 'finance', 'production', 'hr', 'other'])],
            'title' => ['required', 'string', 'min:2', 'max:255'],
            // PDFs and common document formats only — same spirit as the
            // compliance upload flow.
            'file' => ['required', 'file', 'max:'.self::MAX_KB, 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx,ppt,pptx'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.max' => 'The document may not be larger than 10 MB.',
        ];
    }
}
