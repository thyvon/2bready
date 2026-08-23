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
    // Exempt from company.active (applied at the parent group in routes/api.php):
    // a user whose *current* company is suspended must still be able to switch
    // away to another (active) company they belong to — CompanyPolicy::switchTo
    // already independently blocks switching INTO a suspended one.
    Route::post('{company}/switch', [CompanyController::class, 'switch'])->withoutMiddleware('company.active');
    Route::get('{company}/users', [CompanyUserController::class, 'index']);
    Route::post('{company}/users', [CompanyUserController::class, 'store']);
    Route::patch('{company}/users/{user}', [CompanyUserController::class, 'update']);
});
