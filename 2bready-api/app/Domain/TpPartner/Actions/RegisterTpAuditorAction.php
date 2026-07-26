<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Actions;

use App\Domain\TpPartner\DTOs\RegisterAuditorData;
use App\Domain\TpPartner\Models\Auditor;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Enums\UserStatus;
use App\Domain\User\Models\User;

/**
 * Mirrors CreateInternalUserAction exactly — TP staff get credentials issued
 * by 2bReady admin, no self-registration (per Rule #4: auditors authenticate
 * through the standard users table with the auditor role, never a parallel
 * auth system).
 */
class RegisterTpAuditorAction
{
    public function execute(TpPartner $tpPartner, RegisterAuditorData $data): User
    {
        $user = User::create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password,
            'status' => UserStatus::Active,
            'email_verified_at' => now(),
        ]);

        $user->syncRoles(['auditor']);

        Auditor::create([
            'user_id' => $user->id,
            'tp_partner_id' => $tpPartner->id,
        ]);

        return $user;
    }
}
