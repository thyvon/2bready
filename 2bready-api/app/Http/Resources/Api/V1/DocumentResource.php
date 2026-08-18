<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * No file_path or any storage detail here on purpose — never expose the raw
 * storage key. Downloading/previewing the actual file is a separate,
 * deliberately-not-built-yet endpoint (see UploadDocumentAction's docblock).
 *
 * @mixin Document
 */
class DocumentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_template_id' => $this->document_template_id,
            'original_filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'status' => $this->status,
            // The compliance period this filing covers, for periodic
            // requirements ("2026-07" / "2026"); null for one-time and
            // rolling.
            'period_key' => $this->period_key,
            'comment' => $this->comment,
            'verified_by_user_id' => $this->verified_by_user_id,
            'rejected_by_user_id' => $this->rejected_by_user_id,
            'verified_at' => $this->verified_at,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
            // Only present when eager-loaded (the back-office review queue) —
            // a company viewing its own upload already knows which company
            // and template it is, so this stays absent from that response.
            'company' => $this->whenLoaded('company', function () {
                /** @var Company $company */
                $company = $this->company;

                return ['id' => $company->id, 'name' => $company->name];
            }),
            'document_template' => $this->whenLoaded('documentTemplate', function () {
                /** @var DocumentTemplate $template */
                $template = $this->documentTemplate;

                return ['id' => $template->id, 'name' => $template->name];
            }),
            // Journey level the document sits in (e.g. "L3") — the back-office
            // UI uses it to know which documents the Vault gates (L3/L4
            // sensitive) before it even attempts a preview, rather than only
            // learning from a 403. Null when the template chain isn't loaded.
            'level_code' => $this->whenLoaded('documentTemplate', function () {
                return $this->documentTemplate?->milestone?->journeyLevel?->code;
            }),
        ];
    }
}
