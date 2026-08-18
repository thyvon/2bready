<?php

declare(strict_types=1);

namespace App\Domain\TrustBadge\Jobs;

use App\Domain\TrustBadge\Models\Certificate;
use App\Domain\TrustBadge\Models\TrustBadge;
use App\Domain\TrustBadge\Services\CertificateGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Renders and stores the certificate PDF for an issued trust badge (v3 §1.6).
 * Dispatched from IssueTrustBadgeListener — PDF rendering is slow work and
 * must never block the request thread, so this is always queued. Uses the
 * trust badge id (scalar), mirroring ScanDocumentForMalwareJob's id-based
 * pattern rather than SerializesModels loading the model eagerly.
 */
class GenerateCertificateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly string $trustBadgeId) {}

    public function handle(CertificateGenerationService $service): void
    {
        $badge = TrustBadge::query()->withoutGlobalScope('company')
            ->with(['company', 'audit'])
            ->find($this->trustBadgeId);

        if (! $badge) {
            return;
        }

        // Guard against re-runs (e.g. a redelivered queue message) — a badge
        // gets exactly one certificate.
        if (Certificate::query()->where('trust_badge_id', $badge->id)->exists()) {
            return;
        }

        try {
            $service->generate($badge);
        } catch (\Throwable $e) {
            Log::error('Certificate generation failed', [
                'trust_badge_id' => $badge->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
