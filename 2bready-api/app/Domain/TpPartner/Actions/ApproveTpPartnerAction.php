<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Actions;

use App\Domain\TpPartner\Enums\TpPartnerStatus;
use App\Domain\TpPartner\Models\TpPartner;
use App\Exceptions\InvalidTpPartnerTransitionException;

/** Admin approves an onboarding application — the firm becomes browsable. */
class ApproveTpPartnerAction
{
    public function execute(TpPartner $tpPartner): TpPartner
    {
        if ($tpPartner->status !== TpPartnerStatus::PendingApproval) {
            throw new InvalidTpPartnerTransitionException('Only a pending_approval firm can be approved.');
        }

        $tpPartner->update(['status' => TpPartnerStatus::Active]);

        return $tpPartner->fresh();
    }
}
