<?php

declare(strict_types=1);

namespace App\Domain\Vault\Jobs;

use App\Domain\Vault\Services\VaultAutoLockService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Dispatched by the scheduler (routes/console.php) on the queue, never inline
 * on a request thread. Runs the server-side auto-lock sweep — the enforced
 * timeout the frontend timer is never trusted with (v3 §4.2). Access checks
 * also expire lazily via VaultAutoLockService, so a stale session never
 * outlives its window even if the scheduler was down.
 */
class ExpireIdleVaultSessionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(VaultAutoLockService $autoLock): void
    {
        $autoLock->expireStaleSessions();
    }
}
