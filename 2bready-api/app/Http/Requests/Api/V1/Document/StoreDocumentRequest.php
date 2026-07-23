<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Document;

use App\Domain\Document\Rules\BackfillPeriodIsMissing;
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
            // Only present when filing for a past period (backfill) — omitted
            // entirely for a normal "upload for now" submission, which stays
            // exactly as before. See BackfillPeriodIsMissing.
            'period_key' => ['sometimes', 'nullable', 'string', 'regex:/^\d{4}(-\d{2})?$/', app(BackfillPeriodIsMissing::class)],
        ];
    }
}
