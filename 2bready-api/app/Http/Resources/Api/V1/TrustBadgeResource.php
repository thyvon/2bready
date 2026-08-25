<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\TrustBadge\Models\TrustBadge;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin TrustBadge */
class TrustBadgeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'level' => $this->level,
            'issued_at' => $this->issued_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'qr_payload_url' => $this->qr_payload_url,
            'audit_id' => $this->audit_id,
            'certificate' => $this->whenLoaded('certificate', function () {
                return $this->certificate ? [
                    'id' => $this->certificate->id,
                    // Signed URL (30-min), same delivery as the public verify
                    // endpoint — a raw storage path would 404 for the browser.
                    'pdf_url' => Storage::disk(config('filesystems.documents_disk'))
                        ->temporaryUrl($this->certificate->pdf_url, now()->addMinutes(30)),
                    'qr_payload_url' => $this->certificate->qr_payload_url,
                    'master_verifier_stamp' => $this->certificate->master_verifier_stamp,
                    'issued_at' => $this->certificate->issued_at?->toISOString(),
                ] : null;
            }),
        ];
    }
}
