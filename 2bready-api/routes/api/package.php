<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\PackageController;
use Illuminate\Support\Facades\Route;

Route::prefix('packages')->group(function () {
    Route::get('/', [PackageController::class, 'index']);
    Route::post('/', [PackageController::class, 'store']);
    Route::get('{package}', [PackageController::class, 'show']);
    Route::patch('{package}', [PackageController::class, 'update']);
    Route::delete('{package}', [PackageController::class, 'destroy']);
});
