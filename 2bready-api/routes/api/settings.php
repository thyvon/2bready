<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\PlatformSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware('permission:settings.manage')->prefix('settings')->group(function () {
    Route::get('/', [PlatformSettingController::class, 'index']);
    Route::patch('{key}', [PlatformSettingController::class, 'update']);
});
