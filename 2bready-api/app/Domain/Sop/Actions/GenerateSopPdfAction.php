<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\Models\Sop;
use App\Domain\TrustBadge\Services\DomPdfFontRegistrar;
use Barryvdh\DomPDF\Facade\Pdf as DomPdf;

/**
 * Renders an SOP as an A4 PDF document (both language sections when present)
 * for the admin detail page's embedded viewer and download.
 *
 * Rendered on demand rather than persisted — SOPs are editable, so a stored
 * file would go stale after every save. Single-document renders are fast
 * enough to serve inline; the queued-certificate pattern exists for batch
 * issuance, not per-view streaming.
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
        $this->fontRegistrar->register();

        return DomPdf::loadView('sops.document', [
            'title' => $sop->title,
            'version' => $sop->version,
            'effectiveLabel' => $sop->effective_at?->format('Y-m-d') ?? 'Immediate',
            'companyName' => $sop->company?->name,
            'scopeLabel' => $sop->company_id === null ? 'Global template' : '',
            'enLabel' => $enLabel,
            'khLabel' => $khLabel,
            'contentEn' => $contentEn,
            'contentKh' => $contentKh,
        ])
            ->setPaper('a4', 'portrait')
            ->output();
    }
}
