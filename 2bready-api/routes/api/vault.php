<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\VaultController;
use Illuminate\Support\Facades\Route;

// Back-office vault — the PIN gate over sensitive L3/L4 document previews
// (v3 §4.2/§5.1). Roles, matching the blueprint ("Only Admin or Finance can
// unlock vault"): set-pin is admin-only; status/unlock/lock are admin+finance.
// Staff keeps document.view for ordinary documents but holds no vault role —
// sensitive documents stay locked to staff, exactly as the blueprint intends.
Route::prefix('vault')->group(function () {
    Route::get('status', [VaultController::class, 'status'])->middleware('permission:vault.view');

    Route::post('pin', [VaultController::class, 'setPin'])->middleware('permission:vault.manage');
    Route::post('unlock', [VaultController::class, 'unlock'])->middleware('permission:vault.unlock');
    Route::post('lock', [VaultController::class, 'lock'])->middleware('permission:vault.unlock');
});
