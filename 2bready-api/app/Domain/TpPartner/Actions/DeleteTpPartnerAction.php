<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Actions;

use App\Domain\TpPartner\Models\TpPartner;

class DeleteTpPartnerAction
{
    public function execute(TpPartner $tpPartner): void
    {
        $tpPartner->delete();
    }
}
