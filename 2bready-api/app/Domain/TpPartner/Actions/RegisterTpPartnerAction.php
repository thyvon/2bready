<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Actions;

use App\Domain\TpPartner\DTOs\TpPartnerData;
use App\Domain\TpPartner\Enums\TpPartnerStatus;
use App\Domain\TpPartner\Models\TpPartner;

class RegisterTpPartnerAction
{
    /**
     * New firms land in pending_approval (Sprint 7 onboarding): they are not
     * browsable by companies and their auditors' firm is invisible to the
     * marketplace until an admin approves them.
     */
    public function execute(TpPartnerData $data): TpPartner
    {
        return TpPartner::create([
            'name' => $data->name,
            'name_kh' => $data->name_kh,
            'status' => TpPartnerStatus::PendingApproval,
            'price_l2_cents' => $data->price_l2_cents,
            'price_l3_cents' => $data->price_l3_cents,
            'price_l4_cents' => $data->price_l4_cents,
            'price_l1_cents' => $data->price_l1_cents,
        ]);
    }
}
