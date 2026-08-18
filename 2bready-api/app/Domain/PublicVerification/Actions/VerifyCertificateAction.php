<?php

declare(strict_types=1);

namespace App\Domain\PublicVerification\Actions;

use App\Domain\TrustBadge\Models\Certificate;
use App\Domain\TrustBadge\Models\TrustBadge;
use Illuminate\Support\Facades\Storage;

/**
 * The public verify lookup (v3 §1.5/§1.6): reads a certificate by audit_id —
 * the audit's own identifier, used directly in the QR/URL per confirmed
 * blueprint behavior. Reads only the narrow, denormalized certificates table
 * (joined to its badge + company name for display) and returns only
 * certificate-safe fields — never a company's other documents or internal
 * data. No auth; the public route is separately throttled and cacheable.
 * Returns null for an unknown audit id (the route 404s).
 */
class VerifyCertificateAction
{
    /** @return array<string, mixed>|null */
    public function execute(string $auditId): ?array
    {
        /** @var Certificate|null $certificate */
        $certificate = Certificate::query()
            ->with(['trustBadge.company', 'trustBadge.audit'])
            ->where('audit_id', $auditId)
            ->first();

        if (! $certificate) {
            return null;
        }

        /** @var TrustBadge $badge */
        $badge = $certificate->trustBadge;

        return [
            'audit_id' => $certificate->audit_id,
            'level' => $badge->level,
            'company_name' => $badge->company->name,
            'company_name_kh' => $badge->company->name_kh,
            'issued_at' => $certificate->issued_at->toISOString(),
            'score' => $badge->audit?->score,
            'pdf_url' => Storage::disk(config('filesystems.documents_disk'))
                ->temporaryUrl($certificate->pdf_url, now()->addMinutes(30)),
            'qr_payload_url' => $certificate->qr_payload_url,
            'master_verifier_stamp' => $certificate->master_verifier_stamp,
        ];
    }
}
