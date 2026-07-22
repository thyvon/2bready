<?php

declare(strict_types=1);

namespace App\Domain\Document\Jobs;

use App\Domain\Document\Actions\ExpireOverdueDocumentsAction;
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
class ExpireOverdueDocumentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(ExpireOverdueDocumentsAction $action): void
    {
        $action->execute();
    }
}
