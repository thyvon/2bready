<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::prefix('subscriptions')->group(function () {
    Route::get('/', [SubscriptionController::class, 'index']);
    Route::post('/', [SubscriptionController::class, 'store']);
});

Route::prefix('payments')->group(function () {
    Route::get('/', [PaymentController::class, 'index']);
    Route::post('{payment}/submit', [PaymentController::class, 'submit']);
    Route::post('{payment}/confirm', [PaymentController::class, 'confirm']);
    Route::post('{payment}/reject', [PaymentController::class, 'reject']);
});

// Authenticated-only listing for sales followup — capture itself is public (routes/api.php).
Route::get('leads', [LeadController::class, 'index']);
