<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Actions;

use App\Domain\Marketplace\Enums\TpHirePayoutStatus;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\User\Models\User;

/**
 * Ledger bookkeeping only — no real bank disbursement integration in v1.
 * Admin confirms the payout to the TP firm happened outside the system
 * (same "build the real record, automate later" approach already used for
 * manual bank-transfer payment confirmation).
 */
class MarkTpHirePaidOutAction
{
    public function execute(TpHire $tpHire, User $confirmedBy): TpHire
    {
        $tpHire->update([
            'payout_status' => TpHirePayoutStatus::PaidOut,
            'payout_confirmed_by' => $confirmedBy->id,
            'payout_confirmed_at' => now(),
        ]);

        return $tpHire;
    }
}
