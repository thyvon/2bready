<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\GoogleOAuthSettingController;
use App\Http\Controllers\Api\V1\PlatformSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware('permission:settings.manage')->prefix('settings')->group(function () {
    Route::get('/', [PlatformSettingController::class, 'index']);

    // Dedicated endpoint, not another generic {key} — the secret needs
    // encryption + must never round-trip back in plaintext (see
    // GoogleOAuthSettingService's docblock). Must be registered before the
    // generic {key} wildcard below, or that route swallows "google-oauth" as
    // a literal key value instead.
    Route::get('google-oauth', [GoogleOAuthSettingController::class, 'show']);
    Route::patch('google-oauth', [GoogleOAuthSettingController::class, 'update']);

    Route::patch('{key}', [PlatformSettingController::class, 'update']);
});
