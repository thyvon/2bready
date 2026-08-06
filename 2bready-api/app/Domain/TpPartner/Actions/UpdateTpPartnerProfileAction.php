<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Actions;

use App\Domain\TpPartner\Models\TpPartner;
use Illuminate\Support\Arr;

/**
 * Updates ONLY the identity fields of a TP partner (name / name_kh). The
 * dedicated /profile endpoint is the second self-service slice a firm's own
 * auditors can touch (see TpPartnerPolicy::updateProfile) — the fill guard
 * here is the last line of defense: whatever the request carries, nothing
 * but the two name columns may reach the model. Status stays admin-only.
 */
class UpdateTpPartnerProfileAction
{
    /** @param array<string, string|null> $profile */
    public function execute(TpPartner $tpPartner, array $profile): TpPartner
    {
        $tpPartner->fill(Arr::only($profile, ['name', 'name_kh']));
        $tpPartner->save();

        return $tpPartner;
    }
}
