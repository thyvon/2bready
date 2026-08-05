<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Actions;

use App\Domain\Marketplace\Enums\TpHireStatus;
use App\Domain\Marketplace\Models\TpHire;

/**
 * Called from ConfirmPaymentAction's TpHire branch once the company's
 * payment is confirmed. Guarded against resurrecting a cancelled hire: if
 * the company cancelled after submitting payment (CancelTpHireAction marks
 * the payment failed), a late admin confirm must not flip the hire back to
 * active — the cancellation is the newer, deliberate state.
 */
class ActivateTpHireAction
{
    public function execute(TpHire $tpHire): TpHire
    {
        if ($tpHire->status !== TpHireStatus::PendingPayment) {
            return $tpHire;
        }

        $tpHire->update([
            'status' => TpHireStatus::Active,
            'hired_at' => now(),
        ]);

        return $tpHire;
    }
}
