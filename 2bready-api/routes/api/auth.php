<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

// Public
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Authenticated
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    Route::prefix('totp')->middleware('throttle:totp')->group(function () {
        Route::post('setup', [AuthController::class, 'totpSetup']);
        Route::post('confirm', [AuthController::class, 'totpConfirm']);
        Route::post('verify', [AuthController::class, 'totpVerify']);
    });
});
