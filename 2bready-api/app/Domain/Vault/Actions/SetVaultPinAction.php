<?php

declare(strict_types=1);

namespace App\Domain\Vault\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Vault\Models\VaultUnlockLog;
use Illuminate\Support\Facades\Hash;

/**
 * Admin-only: set or rotate a company's vault PIN (v3 §4.2). The PIN is
 * stored only as a bcrypt hash on companies.vault_pin_hash — never logged,
 * never returned in any API response. Setting a new PIN closes any open
 * sessions (the old credential no longer grants anything).
 */
class SetVaultPinAction
{
    public function execute(Company $company, string $pin): void
    {
        $company->forceFill(['vault_pin_hash' => Hash::make($pin)])->save();

        // A rotated PIN invalidates every existing session for this company —
        // there's no way to prove the new PIN was used to unlock those.
        VaultUnlockLog::query()
            ->where('company_id', $company->id)
            ->whereNull('locked_at')
            ->update(['locked_at' => now(), 'lock_reason' => 'manual']);
    }
}
