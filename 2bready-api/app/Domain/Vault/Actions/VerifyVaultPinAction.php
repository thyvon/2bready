<?php

declare(strict_types=1);

namespace App\Domain\Vault\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use App\Domain\Vault\Exceptions\InvalidVaultPinException;
use App\Domain\Vault\Exceptions\VaultPinNotSetException;
use App\Domain\Vault\Services\VaultAccessService;
use Illuminate\Support\Facades\Hash;

/**
 * Back-office unlock (v3 §4.2): compares the submitted PIN against the
 * company's bcrypt hash server-side only — the hash is never logged or
 * returned, and the comparison result is the only thing that leaves here.
 * On success an unlock session is opened (vault_unlock_logs access trail).
 * Role gating (admin/finance only) is enforced by route middleware, not here.
 */
class VerifyVaultPinAction
{
    public function __construct(private readonly VaultAccessService $vault) {}

    public function execute(Company $company, string $pin, string $userId): void
    {
        if (! $this->vault->hasPin($company)) {
            throw new VaultPinNotSetException;
        }

        if (! Hash::check($pin, (string) $company->vault_pin_hash)) {
            throw new InvalidVaultPinException;
        }

        $this->vault->unlock(User::query()->findOrFail($userId), $company);
    }
}
