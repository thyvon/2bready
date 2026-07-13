<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Document;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'document_template_id' => ['required', 'string', 'exists:document_templates,id'],
            // MIME + size validated here, before the file ever touches storage
            // or the malware-scan job — CLAUDE.md's non-negotiable rule.
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }
}
