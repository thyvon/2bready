<?php

declare(strict_types=1);

namespace App\Domain\Payment\Jobs;

use App\Domain\Payment\Actions\ExpireOverdueSubscriptionsAction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Dispatched daily by the scheduler (routes/console.php) — the sweep runs on
 * the queue, never inline on a request thread (CLAUDE.md: background jobs
 * always go through Horizon).
 */
class ExpireSubscriptionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(ExpireOverdueSubscriptionsAction $action): void
    {
        $action->execute();
    }
}
