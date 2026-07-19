<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\JourneyController;
use App\Http\Controllers\Api\V1\JourneyLevelController;
use App\Http\Controllers\Api\V1\JourneyTemplateController;
use App\Http\Controllers\Api\V1\MilestoneController;
use Illuminate\Support\Facades\Route;

Route::prefix('journey')->group(function () {
    Route::get('/', [JourneyController::class, 'show']);
    Route::get('companies/{company}', [JourneyController::class, 'showForCompany']);
    Route::post('companies/{company}/milestones/{milestone}/complete', [JourneyController::class, 'completeMilestone']);
});

// Flat taxonomy, not a company's own progress — separate from the group above
// (same reasoning as packages/industries living outside their "usage" routes).
Route::get('journey-levels', [JourneyLevelController::class, 'index']);

// ─── Journey taxonomy authoring (admin CRUD) ────────────────────────────────
Route::prefix('journey-templates')->group(function () {
    Route::get('/', [JourneyTemplateController::class, 'index']);
    Route::post('/', [JourneyTemplateController::class, 'store']);
    Route::get('{journeyTemplate}', [JourneyTemplateController::class, 'show']);
    Route::patch('{journeyTemplate}', [JourneyTemplateController::class, 'update']);
    Route::delete('{journeyTemplate}', [JourneyTemplateController::class, 'destroy']);
    Route::post('{journeyTemplate}/levels', [JourneyLevelController::class, 'store']);
});
Route::patch('journey-levels/{journeyLevel}', [JourneyLevelController::class, 'update']);
Route::delete('journey-levels/{journeyLevel}', [JourneyLevelController::class, 'destroy']);
// Separate POST (not folded into `update`) — Laravel doesn't parse
// multipart bodies on PATCH, so this sidesteps the `_method` spoofing
// workaround entirely and leaves the plain-JSON update endpoint untouched.
Route::post('journey-levels/{journeyLevel}/medal', [JourneyLevelController::class, 'uploadMedal']);
Route::post('journey-levels/{journeyLevel}/milestones', [MilestoneController::class, 'store']);
Route::patch('milestones/{milestone}', [MilestoneController::class, 'update']);
Route::delete('milestones/{milestone}', [MilestoneController::class, 'destroy']);
