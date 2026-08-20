<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\Models\Sop;
use Illuminate\Support\Facades\DB;

/**
 * Activates or deactivates an SOP.
 *
 * Only one active SOP per (company, title) is allowed.
 * Global SOPs (company_id = null) can be activated by admins.
 */
class ActivateSopAction
{
    public function execute(Sop $sop, bool $activate): Sop
    {
        return DB::transaction(function () use ($sop, $activate) {
            if ($activate) {
                // Deactivate other SOPs with same title for this company
                Sop::query()
                    ->where('company_id', $sop->company_id)
                    ->where('title', $sop->title)
                    ->where('id', '!=', $sop->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            $sop->update(['is_active' => $activate]);

            return $sop->fresh();
        });
    }
}
