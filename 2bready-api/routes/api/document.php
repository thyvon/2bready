<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\DocumentController;
use Illuminate\Support\Facades\Route;

Route::prefix('documents')->group(function () {
    Route::get('/', [DocumentController::class, 'index']);
    Route::get('templates', [DocumentController::class, 'templates']);
    Route::post('/', [DocumentController::class, 'store']);
    Route::get('{document}/preview-url', [DocumentController::class, 'previewUrl']);
    Route::post('{document}/verify', [DocumentController::class, 'verify']);
    Route::post('{document}/reject', [DocumentController::class, 'reject']);
});
