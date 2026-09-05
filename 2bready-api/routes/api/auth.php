<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\EmailVerificationController;
use App\Http\Controllers\Api\V1\GoogleAuthController;
use Illuminate\Support\Facades\Route;

// Public
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login'])->middleware(['throttle:login', \Illuminate\Session\Middleware\StartSession::class]);
    Route::post('admin-login', [AuthController::class, 'adminLogin'])->middleware(['throttle:login', \Illuminate\Session\Middleware\StartSession::class]);
    Route::post('tp-login', [AuthController::class, 'tpLogin'])->middleware(['throttle:login', \Illuminate\Session\Middleware\StartSession::class]);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // Identity is proven by the signed hash matching this specific user's email
    // (AppServiceProvider's VerifyEmail::createUrlUsing), not by a bearer token —
    // the user isn't necessarily authenticated in this browser/session when they
    // click the emailed link. POST (not GET) to match the already-built frontend
    // contract (admin-portal's pre-existing verify-email page).
    Route::post('email/verify/{user}/{hash}', [EmailVerificationController::class, 'verify']);

    Route::prefix('google')->group(function () {
        Route::get('status', [GoogleAuthController::class, 'status']);
        Route::get('redirect', [GoogleAuthController::class, 'redirect']);
        Route::get('callback', [GoogleAuthController::class, 'callback']);
        // Public — proof of identity here is the one-time exchange code itself,
        // not a bearer token (see GoogleAuthController::callback's docblock).
        Route::post('exchange', [GoogleAuthController::class, 'exchange'])->middleware('throttle:login');
    });
});

// Authenticated — deliberately NOT wrapped by company.active/email.verified/
// totp.verified (routes/api.php's shared group): a totp-pending token must still
// reach logout/me/totp/*, and an unverified account must still be able to
// resend its own verification email.
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::post('email/verify/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:verification.resend');

    Route::prefix('totp')->middleware('throttle:totp')->group(function () {
        Route::post('setup', [AuthController::class, 'totpSetup']);
        Route::post('confirm', [AuthController::class, 'totpConfirm']);
        Route::post('verify', [AuthController::class, 'totpVerify']);
    });
});
