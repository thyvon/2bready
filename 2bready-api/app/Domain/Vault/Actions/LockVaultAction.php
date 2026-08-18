<?php

declare(strict_types=1);

namespace App\Domain\Vault\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use App\Domain\Vault\Enums\VaultLockReason;
use App\Domain\Vault\Services\VaultAccessService;

/**
 * Manual close of a back-office vault session — the "manual" branch of
 * VaultLockReason. The role_change branch is the same row shape with a
 * different reason; callers pass which one happened.
 */
class LockVaultAction
{
    public function __construct(private readonly VaultAccessService $vault) {}

    public function execute(User $user, Company $company, VaultLockReason $reason = VaultLockReason::Manual): void
    {
        $this->vault->lock($user, $company, $reason);
    }
}
