<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\BrandingController;
use App\Http\Controllers\Api\V1\GoogleOAuthSettingController;
use App\Http\Controllers\Api\V1\MailSettingController;
use App\Http\Controllers\Api\V1\PlatformSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware('permission:settings.manage')->prefix('settings')->group(function () {
    Route::get('/', [PlatformSettingController::class, 'index']);

    // Platform logos — files, not scalars, so they get their own endpoints
    // instead of the generic {key} patch (which only stores JSON values).
    // The request's `slot` field (main/dark/footer/footer_dark, default
    // main) selects which branding slot the file lands in. Must be
    // registered before the generic {key} wildcard below.
    Route::post('logo', [BrandingController::class, 'uploadLogo']);
    Route::delete('logo', [BrandingController::class, 'deleteLogo']);

    // Dedicated endpoints, not another generic {key} — both secrets need
    // encryption + must never round-trip back in plaintext (see
    // GoogleOAuthSettingService/MailSettingService's docblocks). Must be
    // registered before the generic {key} wildcard below, or that route
    // swallows these as a literal key value instead.
    Route::get('google-oauth', [GoogleOAuthSettingController::class, 'show']);
    Route::patch('google-oauth', [GoogleOAuthSettingController::class, 'update']);

    Route::get('mail', [MailSettingController::class, 'show']);
    Route::patch('mail', [MailSettingController::class, 'update']);
    Route::post('mail/test', [MailSettingController::class, 'test']);

    Route::patch('{key}', [PlatformSettingController::class, 'update']);
});
