<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\IndustryController;
use Illuminate\Support\Facades\Route;

Route::prefix('industries')->group(function () {
    Route::get('/', [IndustryController::class, 'index']);
    Route::post('/', [IndustryController::class, 'store']);
    Route::get('{industry}', [IndustryController::class, 'show']);
    Route::patch('{industry}', [IndustryController::class, 'update']);
    Route::delete('{industry}', [IndustryController::class, 'destroy']);
});
