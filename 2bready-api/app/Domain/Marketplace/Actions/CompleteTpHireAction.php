<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Actions;

use App\Domain\Marketplace\Enums\TpHireStatus;
use App\Domain\Marketplace\Models\TpHire;

/**
 * Manual for v1 — admin or the TP itself marks an engagement done. Automatic
 * completion detection (e.g. once every document at this level is verified)
 * would need deeper Journey/Milestone integration; deliberately not built
 * here, flagged as a v1 gap rather than silently approximated.
 */
class CompleteTpHireAction
{
    public function execute(TpHire $tpHire): TpHire
    {
        $tpHire->update([
            'status' => TpHireStatus::Completed,
            'completed_at' => now(),
        ]);

        return $tpHire;
    }
}
