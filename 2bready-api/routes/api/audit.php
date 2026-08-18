<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuditController;
use Illuminate\Support\Facades\Route;

// The audit lifecycle. Split by policy/permission inside the controller, not
// by route tree, per this project's "one file per domain, not per portal"
// convention: GET (viewAny: admin + company_owner via scope + auditor via
// firm), POST store/assign/review/cancel (admin audit.manage), submit (the
// individually assigned auditor, audit.conduct). Routes use string ids +
// withoutGlobalScope('company') resolution in the controller so TP/auditor
// callers (never company-bypassed) reach AuditPolicy instead of 404ing on
// the scoped implicit binding — same pattern as tp-hires complete().
Route::prefix('audits')->group(function () {
    Route::get('/', [AuditController::class, 'index']);
    Route::post('/', [AuditController::class, 'store']);
    Route::get('{audit}', [AuditController::class, 'show']);
    Route::post('{audit}/assign', [AuditController::class, 'assign']);
    Route::post('{audit}/submit', [AuditController::class, 'submit']);
    Route::post('{audit}/review', [AuditController::class, 'review']);
    Route::post('{audit}/cancel', [AuditController::class, 'cancel']);
});
