<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\TrustBadge\Models\TrustBadge;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
                    'pdf_url' => $this->certificate->pdf_url,
                    'qr_payload_url' => $this->certificate->qr_payload_url,
                    'master_verifier_stamp' => $this->certificate->master_verifier_stamp,
                    'issued_at' => $this->certificate->issued_at?->toISOString(),
                ] : null;
            }),
        ];
    }
}
