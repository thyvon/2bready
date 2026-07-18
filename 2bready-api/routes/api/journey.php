<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\JourneyController;
use App\Http\Controllers\Api\V1\JourneyLevelController;
use Illuminate\Support\Facades\Route;

Route::prefix('journey')->group(function () {
    Route::get('/', [JourneyController::class, 'show']);
    Route::get('companies/{company}', [JourneyController::class, 'showForCompany']);
    Route::post('companies/{company}/milestones/{milestone}/complete', [JourneyController::class, 'completeMilestone']);
});

// Flat taxonomy, not a company's own progress — separate from the group above
// (same reasoning as packages/industries living outside their "usage" routes).
Route::get('journey-levels', [JourneyLevelController::class, 'index']);
