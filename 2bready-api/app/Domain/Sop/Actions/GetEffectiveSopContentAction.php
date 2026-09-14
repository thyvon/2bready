<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\Models\Sop;

/**
 * Resolves the content a user's company should see for an SOP — the
 * company's adoption override when one exists, else the SOP's own
 * (global or company-specific) content.
 *
 * Internal roles (admin/staff/finance) have no current company; they get the
 * base content without any override layer.
 */
class GetEffectiveSopContentAction
{
    /**
     * @param  'en'|'kh'  $locale
     * @return array{content: ?string, source: 'override'|'base', locale: string}
     */
    public function execute(Sop $sop, ?string $companyId, string $locale = 'en'): array
    {
        if ($companyId === null) {
            return [
                'content' => $locale === 'kh' && $sop->content_kh !== null && $sop->content_kh !== ''
                    ? $sop->content_kh
                    : $sop->content_en,
                'source' => 'base',
                'locale' => $locale,
            ];
        }

        return [...$sop->effectiveContentFor($companyId, $locale), 'locale' => $locale];
    }
}
