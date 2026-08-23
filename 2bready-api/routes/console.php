<?php

declare(strict_types=1);

use App\Domain\Document\Jobs\ExpireOverdueDocumentsJob;
use App\Domain\Document\Jobs\SendDocumentExpiryRemindersJob;
use App\Domain\Payment\Jobs\ExpireSubscriptionsJob;
use App\Domain\Vault\Jobs\ExpireIdleVaultSessionsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// First scheduled commands in this app — production's standalone
// docker-compose stack must run `php artisan schedule:work` (or a host
// crontab entry calling `schedule:run` every minute) for these to actually
// fire; nothing invokes Laravel's scheduler yet otherwise.
Schedule::job(new ExpireOverdueDocumentsJob)->dailyAt('01:00');

// Runs after the expiry sweep above, so a document that expired overnight
// isn't also sent a "will expire soon" reminder in the same run.
Schedule::job(new SendDocumentExpiryRemindersJob)->dailyAt('01:15');

// Server-side vault auto-lock — runs every minute so a back-office unlock
// session can't outlive its idle window between access checks (which also
// expire lazily; this is the belt-and-suspenders sweep, v3 §4.2).
Schedule::job(new ExpireIdleVaultSessionsJob)->everyMinute();

// Subscription entitlement sweep — flips active → expired once expires_at
// passes, so à-la-carte entitlements actually lapse instead of accumulating
// forever. Runs right after the document expiry sweep (same "overnight"
// window, one queue burst).
Schedule::job(new ExpireSubscriptionsJob)->dailyAt('01:30');
