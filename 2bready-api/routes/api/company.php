<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\CompanyUserController;
use Illuminate\Support\Facades\Route;

Route::prefix('companies')->group(function () {
    Route::get('/', [CompanyController::class, 'index']);
    Route::post('/', [CompanyController::class, 'store']);
    Route::post('register', [CompanyController::class, 'registerOwn']);
    Route::get('{company}', [CompanyController::class, 'show']);
    Route::patch('{company}', [CompanyController::class, 'update']);
    Route::delete('{company}', [CompanyController::class, 'destroy']);
    Route::post('{company}/switch', [CompanyController::class, 'switch']);
    Route::get('{company}/users', [CompanyUserController::class, 'index']);
    Route::patch('{company}/users/{user}', [CompanyUserController::class, 'update']);
});
