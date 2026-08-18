<?php

declare(strict_types=1);

namespace App\Domain\TrustBadge\Services;

use Barryvdh\DomPDF\Facade\Pdf as DomPdf;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Registers the Khmer typeface into DomPDF's font directory. DomPDF is
 * stateless between processes — the first render in a fresh cache dir needs
 * the font installed once (it caches the .ufm metrics after that). Called
 * idempotently from CertificateGenerationService before every render so a
 * wiped storage/fonts self-heals without a deploy step.
 *
 * KhmerOSmuol is committed under resources/fonts/ (the OFL-licensed Khmer OS
 * family, a standard Khmer typeface available in the Debian fonts-khmeros
 * package) — DomPDF's bundled DejaVu covers Latin only, so certificates
 * would render Khmer as tofu without it.
 */
class DomPdfFontRegistrar
{
    /** @var array<string, string> Family name => committed TTF path. */
    private const FONTS = [
        'KhmerOSmuol' => 'KhmerOSmuol.ttf',
        'KhmerOSsiemreap' => 'KhmerOSsiemreap.ttf',
    ];

    public function register(): void
    {
        $fontDir = config('dompdf.font_dir');

        if (! is_string($fontDir)) {
            return;
        }

        try {
            $fontMetrics = DomPdf::getDompdf()->getFontMetrics();
            $installed = $fontMetrics->getFontFamilies();

            foreach (self::FONTS as $family => $file) {
                if (isset($installed[strtolower($family)])) {
                    continue;
                }

                $ttf = resource_path('fonts/'.$file);

                if (! is_file($ttf)) {
                    Log::warning('Missing certificate font', ['font' => $family, 'path' => $ttf]);

                    continue;
                }

                // Register normal + bold (KhmerOSmuol has no bold face; DomPDF
                // synthesizes it from the same file). registerFont() copies the
                // TTF into the font dir and writes the .ufm cache.
                foreach (['normal' => 'normal', 'bold' => 'normal'] as $weight => $style) {
                    $fontMetrics->registerFont([
                        'family' => $family,
                        'weight' => $weight,
                        'style' => $style,
                    ], $ttf);
                }
            }
        } catch (Throwable $e) {
            // Never fail a certificate render because font setup broke — the
            // PDF would just fall back to DejaVu (Latin-only) for that run.
            Log::warning('Failed to register certificate fonts', ['error' => $e->getMessage()]);
        }
    }
}
