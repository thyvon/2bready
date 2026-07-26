<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ProfileController;
use Illuminate\Support\Facades\Route;

// Distinct from GET auth/me (AuthController::me, read-only) — these mutate
// the caller's own row. Generic across every account type (admin/staff/
// finance/auditor/company_owner/company_member), no permission gate beyond
// the shared authenticated group this is required into.
Route::prefix('me')->group(function () {
    Route::put('/', [ProfileController::class, 'update']);
    Route::put('password', [ProfileController::class, 'changePassword']);
});
