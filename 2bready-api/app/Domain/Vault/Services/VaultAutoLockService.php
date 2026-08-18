<?php

declare(strict_types=1);

namespace App\Domain\Vault\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\Vault\Enums\VaultLockReason;
use App\Domain\Vault\Models\VaultUnlockLog;
use Illuminate\Support\Carbon;

/**
 * The server-side auto-lock — the *only* thing that decides a vault session
 * has gone idle (v3 §4.2: "enforced server-side via VaultAutoLockService, not
 * trusted to a frontend timer"). Reads the timeout from
 * platform_settings.vault_auto_lock_minutes (seed 3, admin-editable) rather
 * than a hardcoded literal. Called from the scheduled job AND lazily from
 * VaultAccessService on each access check, so a stale session never survives
 * past its window even if the scheduler was down.
 */
class VaultAutoLockService
{
    public function __construct(private readonly PlatformSettingService $settings) {}

    /** @return int minutes of inactivity before a session auto-locks */
    public function autoLockMinutes(): int
    {
        return (int) $this->settings->get('vault_auto_lock_minutes', 3);
    }

    /**
     * True once now - unlocked_at exceeds the idle window — a pure evaluation,
     * no side effects (so callers can decide before mutating).
     */
    public function isExpired(VaultUnlockLog $log, ?Carbon $now = null): bool
    {
        $now ??= now();

        return $now->diffInMinutes($log->unlocked_at, true) >= $this->autoLockMinutes();
    }

    /**
     * Close every open session past its idle window (reason: timeout).
     * Idempotent — already-locked rows are skipped. Runs from the scheduled
     * job and from VaultAccessService::hasActiveUnlock.
     */
    public function expireStaleSessions(): void
    {
        VaultUnlockLog::query()
            ->whereNull('locked_at')
            ->get()
            ->filter(fn (VaultUnlockLog $log) => $this->isExpired($log))
            ->each(function (VaultUnlockLog $log) {
                $log->forceFill([
                    'locked_at' => now(),
                    'lock_reason' => VaultLockReason::Timeout,
                ])->save();
            });
    }

    /**
     * Close any open session for a given company that has gone idle — used
     * by the access check so a company's stale session is closed even when
     * the user never triggers the global sweep.
     */
    public function expireStaleSessionsForCompany(Company $company): void
    {
        VaultUnlockLog::query()
            ->where('company_id', $company->id)
            ->whereNull('locked_at')
            ->get()
            ->filter(fn (VaultUnlockLog $log) => $this->isExpired($log))
            ->each(function (VaultUnlockLog $log) {
                $log->forceFill([
                    'locked_at' => now(),
                    'lock_reason' => VaultLockReason::Timeout,
                ])->save();
            });
    }
}
