<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\Models\Sop;
use App\Domain\TrustBadge\Services\DomPdfFontRegistrar;
use Barryvdh\DomPDF\Facade\Pdf as DomPdf;
use Illuminate\Support\Facades\Http;

/**
 * Renders an SOP as an A4 PDF document (both language sections when present)
 * for the admin detail page's embedded viewer and download.
 *
 * Two engines behind one template, chosen by configuration:
 *
 * - Gotenberg (services.gotenberg.url set): Chromium renders the same blade
 *   HTML with full complex-script shaping. REQUIRED for correct Khmer —
 *   DomPDF has no GSUB/GPOS shaping, so combining marks render as dotted
 *   circles and subscripts misplace (visible in real Khmer copy).
 * - DomPDF fallback (no URL configured): works everywhere, Latin-perfect,
 *   Khmer degraded.
 *
 * Rendered on demand rather than persisted — SOPs are editable, so a stored
 * file would go stale after every save.
 */
class GenerateSopPdfAction
{
    public function __construct(
        private readonly DomPdfFontRegistrar $fontRegistrar,
    ) {}

    /**
     * @param  string|null  $contentKh  Null omits the Khmer section.
     * @return string Raw PDF bytes (starts with %PDF).
     */
    public function execute(
        Sop $sop,
        string $contentEn,
        ?string $contentKh,
        string $enLabel,
        string $khLabel,
    ): string {
        /** @var array<string, mixed> $viewData */
        $viewData = [
            'title' => $sop->title,
            'version' => $sop->version,
            'effectiveLabel' => $sop->effective_at?->format('Y-m-d') ?? 'Immediate',
            'companyName' => $sop->company?->name,
            'scopeLabel' => $sop->company_id === null ? 'Global template' : '',
            'enLabel' => $enLabel,
            'khLabel' => $khLabel,
            'contentEn' => $contentEn,
            'contentKh' => $contentKh,
        ];

        $gotenbergUrl = rtrim((string) config('services.gotenberg.url'), '/');
        if ($gotenbergUrl !== '') {
            return $this->renderViaGotenberg($gotenbergUrl, view('sops.document', $viewData)->render());
        }

        return $this->renderViaDomPdf($viewData);
    }

    /** Chrome shapes Khmer correctly — the primary path in production. */
    private function renderViaGotenberg(string $baseUrl, string $html): string
    {
        $response = Http::asMultipart()
            ->attach('files', $html, 'index.html')
            ->post($baseUrl.'/forms/chromium/convert/html', [
                'paperWidth' => '8.27in',
                'paperHeight' => '11.69in',
                'marginTop' => '0.4in',
                'marginBottom' => '0.4in',
                'marginLeft' => '0.45in',
                'marginRight' => '0.45in',
                'printBackground' => 'true',
            ]);

        if (! $response->successful() || ! str_starts_with($response->body(), '%PDF')) {
            throw new \RuntimeException('Gotenberg PDF render failed: '.$response->status());
        }

        return $response->body();
    }

    /** Fallback when no Gotenberg service is configured. */
    /**
     * @param  array<string, mixed>  $viewData
     */
    private function renderViaDomPdf(array $viewData): string
    {
        $this->fontRegistrar->register();

        return DomPdf::loadView('sops.document', $viewData)
            ->setPaper('a4', 'portrait')
            ->output();
    }
}
