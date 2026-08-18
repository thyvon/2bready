<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\TrustBadgeController;
use Illuminate\Support\Facades\Route;

// Trust badges — company users list their own earned badges (BelongsToCompany
// scopes by current company; admin/staff/finance bypass by role and see all).
// The public verify page is a separate unauthenticated route in api.php.
Route::prefix('trust-badges')->group(function () {
    Route::get('/', [TrustBadgeController::class, 'index'])->middleware('permission:trust_badge.view');
});
