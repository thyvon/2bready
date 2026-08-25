<?php

declare(strict_types=1);

namespace App\Domain\TrustBadge\Services;

use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\TrustBadge\Models\Certificate;
use App\Domain\TrustBadge\Models\TrustBadge;
use Barryvdh\DomPDF\Facade\Pdf as DomPdf;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode as EndroidQrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * Renders a trust badge's certificate as a bilingual (EN/KH) PDF with a QR
 * code and stores it to the documents disk (v3 §1.6). The QR encodes the
 * public verify URL `{verify_base_url}/{auditId}` — the audit ID used
 * directly per confirmed blueprint behavior — and the footer always stamps
 * the master verification authority from platform_settings
 * (certificate.master_verification_authority), never derived from the hired
 * TP partner (v3 §0.3). The stamp is snapshotted onto the certificate row at
 * issuance so later setting edits don't rewrite historical certificates.
 *
 * Only ever invoked from GenerateCertificateJob (queued — PDF rendering is
 * slow and must never block the request thread).
 */
class CertificateGenerationService
{
    public function __construct(
        private readonly PlatformSettingService $settings,
        private readonly DomPdfFontRegistrar $fontRegistrar,
    ) {}

    public function generate(TrustBadge $badge): Certificate
    {
        $audit = $badge->audit;
        $company = $badge->company;

        $verifyUrl = sprintf(
            '%s/%s',
            rtrim((string) $this->settings->get('certificate.verify_base_url', 'https://verify.2bready.asia'), '/'),
            $badge->audit_id,
        );

        $stamp = $this->masterVerifierStamp();

        $qrDataUri = $this->qrDataUri($verifyUrl);

        /** @var array<string, mixed> $viewData */
        $viewData = [
            'companyName' => $company->name,
            'companyNameKh' => $company->name_kh,
            'level' => $badge->level,
            'auditId' => $badge->audit_id,
            'issuedAt' => $badge->issued_at,
            'score' => $audit->score,
            'verifyUrl' => $verifyUrl,
            'qrDataUri' => $qrDataUri,
            'stamp' => $stamp,
        ];

        // Gotenberg/Chromium first — it shapes Khmer script correctly
        // (cluster reordering + stacking) where DomPDF can only lay out raw
        // glyphs. DomPDF with the registered KhmerOSmuol faces stays as the
        // fallback when no Gotenberg service is configured.
        $gotenbergUrl = rtrim((string) config('services.gotenberg.url'), '/');

        $pdf = $gotenbergUrl !== ''
            ? $this->renderViaGotenberg($gotenbergUrl, view('certificates.trust-audit', $viewData)->render())
            : $this->renderViaDomPdf($viewData);

        $path = sprintf('certificates/%s.pdf', $badge->audit_id);
        Storage::disk(config('filesystems.documents_disk'))->put($path, $pdf);

        /** @var Certificate $certificate */
        $certificate = Certificate::query()->create([
            'trust_badge_id' => $badge->id,
            'audit_id' => $badge->audit_id,
            'pdf_url' => $path,
            'qr_payload_url' => $verifyUrl,
            'master_verifier_stamp' => $stamp,
            'issued_at' => $badge->issued_at,
        ]);

        // Keep the badge's own QR pointer in sync (ERD: nullable until the
        // GenerateCertificateJob completes).
        $badge->update(['qr_payload_url' => $verifyUrl]);

        return $certificate;
    }

    /**
     * Snapshot of the platform verifier text at issuance time. Falls back to
     * the blueprint's default if the setting is absent (fresh install before
     * seed), never a re-read at verify time — that's the point of the stamp.
     *
     * @return array<string, string>
     */
    private function masterVerifierStamp(): array
    {
        $stamp = $this->settings->get('certificate.master_verification_authority', null);

        if (is_array($stamp)) {
            return [
                'verified_by' => (string) ($stamp['verified_by'] ?? ''),
                'approved_by' => (string) ($stamp['approved_by'] ?? ''),
                'prepared_by' => (string) ($stamp['prepared_by'] ?? ''),
            ];
        }

        return [
            'verified_by' => 'ADMIT UNIT Master Auditors',
            'approved_by' => 'ADMIT Global Executive',
            'prepared_by' => '2bReady Trust Engine Powered by ADMIT Global',
        ];
    }

    /** Chromium render — A4 landscape, backgrounds on (the QR + badge chip rely on them). */
    private function renderViaGotenberg(string $baseUrl, string $html): string
    {
        $response = Http::asMultipart()
            ->attach('files', $html, 'index.html')
            ->post($baseUrl.'/forms/chromium/convert/html', [
                'paperWidth' => '11.69in',
                'paperHeight' => '8.27in',
                'marginTop' => '0in',
                'marginBottom' => '0in',
                'marginLeft' => '0in',
                'marginRight' => '0in',
                'printBackground' => 'true',
            ]);

        if (! $response->successful() || ! str_starts_with($response->body(), '%PDF')) {
            throw new \RuntimeException('Gotenberg certificate render failed: '.$response->status());
        }

        return $response->body();
    }

    /** Fallback when no Gotenberg service is configured.
     *
     * @param  array<string, mixed>  $viewData
     */
    private function renderViaDomPdf(array $viewData): string
    {
        $this->fontRegistrar->register();

        return DomPdf::loadView('certificates.trust-audit', $viewData)
            ->setPaper('a4', 'landscape')
            ->output();
    }

    /** @return string data:image/png;base64,... for embedding in the Blade template */
    public function qrDataUri(string $payload): string
    {
        $qrCode = new EndroidQrCode(
            data: $payload,
            size: 220,
            margin: 0,
            errorCorrectionLevel: ErrorCorrectionLevel::Low,
        );

        $result = (new PngWriter)->write($qrCode);

        return 'data:image/png;base64,'.base64_encode($result->getString());
    }
}
