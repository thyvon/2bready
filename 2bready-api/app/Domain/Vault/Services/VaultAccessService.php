<?php

declare(strict_types=1);

namespace App\Domain\Vault\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\User\Models\User;
use App\Domain\Vault\Enums\VaultLockReason;
use App\Domain\Vault\Models\VaultUnlockLog;
use Illuminate\Support\Carbon;

/**
 * Back-office vault gate (v3 §4.2/§5.1): a company's sensitive documents
 * (L3/L4) are only viewable while an admin or finance user holds an open,
 * non-idle unlock session for that company. The PIN is the company's own
 * (companies.vault_pin_hash); unlock sessions live in vault_unlock_logs and
 * are closed server-side by VaultAutoLockService, never a frontend timer.
 *
 * Finance is further restricted to self-uploaded sensitive documents only —
 * the uploadedBy === 'finance' check lives in DocumentPolicy::view (it needs
 * the specific Document to compare against), not here.
 */
class VaultAccessService
{
    public function __construct(
        private readonly PlatformSettingService $settings,
        private readonly VaultAutoLockService $autoLock,
    ) {}

    /** @return int configured PIN length (platform_settings.vault_pin_length, seed 6) */
    public function pinLength(): int
    {
        return (int) $this->settings->get('vault_pin_length', 6);
    }

    public function hasPin(Company $company): bool
    {
        return $company->vault_pin_hash !== null;
    }

    /**
     * True while the user holds an open, non-idle unlock session for the
     * company. Lazily expires stale sessions (VaultAutoLockService) so a
     * single check both evaluates and closes, without trusting the frontend.
     */
    public function isUnlocked(User $user, Company $company): bool
    {
        $this->autoLock->expireStaleSessionsForCompany($company);

        return VaultUnlockLog::query()
            ->where('user_id', $user->id)
            ->where('company_id', $company->id)
            ->whereNull('locked_at')
            ->exists();
    }

    /**
     * Whether this document sits in a sensitive journey level (L3/L4).
     * Mirrors the blueprint's isSensitive = (pid === 'p3' || pid === 'p4')
     * and the DataRoom's verified-documents L3/L4 scoping.
     */
    public function isSensitive(Document $document): bool
    {
        $code = $document->documentTemplate?->milestone?->journeyLevel?->code;

        return in_array($code, ['L3', 'L4'], true);
    }

    /**
     * Open a new unlock session for this user+company — only admin/finance
     * may hold one (the route middleware enforces the role; this method just
     * records the fact). Writing the access-trail row is a side effect, but
     * a deliberate one: it IS the record that proves the vault was unlocked
     * and when.
     */
    public function unlock(User $user, Company $company): VaultUnlockLog
    {
        return VaultUnlockLog::query()->create([
            'user_id' => $user->id,
            'company_id' => $company->id,
            'unlocked_at' => now(),
        ]);
    }

    /**
     * Close every open session this user holds for the company — manual lock
     * (a role change is the same row shape, different reason; the frontend
     * just passes which one happened).
     */
    public function lock(User $user, Company $company, VaultLockReason $reason = VaultLockReason::Manual): void
    {
        VaultUnlockLog::query()
            ->where('user_id', $user->id)
            ->where('company_id', $company->id)
            ->whereNull('locked_at')
            ->update([
                'locked_at' => now(),
                'lock_reason' => $reason->value,
            ]);
    }

    /**
     * The age of the user's current open session, in seconds — the frontend
     * uses it to render "auto-lock in Ns" without owning the timeout logic.
     */
    public function secondsRemaining(User $user, Company $company, ?Carbon $now = null): int
    {
        $now ??= now();
        $log = VaultUnlockLog::query()
            ->where('user_id', $user->id)
            ->where('company_id', $company->id)
            ->whereNull('locked_at')
            ->latest()
            ->first();

        if (! $log) {
            return 0;
        }

        return max(0, ($this->autoLock->autoLockMinutes() * 60) - $now->diffInSeconds($log->unlocked_at, true));
    }
}
