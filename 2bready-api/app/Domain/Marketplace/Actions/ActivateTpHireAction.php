<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Actions;

use App\Domain\Marketplace\Enums\TpHireStatus;
use App\Domain\Marketplace\Models\TpHire;

/** Called from ConfirmPaymentAction's TpHire branch once the company's payment is confirmed. */
class ActivateTpHireAction
{
    public function execute(TpHire $tpHire): TpHire
    {
        $tpHire->update([
            'status' => TpHireStatus::Active,
            'hired_at' => now(),
        ]);

        return $tpHire;
    }
}
