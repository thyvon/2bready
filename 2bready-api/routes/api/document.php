<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\DocumentTemplateController;
use Illuminate\Support\Facades\Route;

Route::prefix('documents')->group(function () {
    Route::get('/', [DocumentController::class, 'index']);
    Route::get('templates', [DocumentController::class, 'templates']);
    Route::post('/', [DocumentController::class, 'store']);
    Route::get('{document}/preview-url', [DocumentController::class, 'previewUrl']);
    Route::post('{document}/verify', [DocumentController::class, 'verify']);
    Route::post('{document}/reject', [DocumentController::class, 'reject']);
});

// ─── Document template authoring (admin CRUD, nested under a milestone) ────
Route::post('milestones/{milestone}/document-templates', [DocumentTemplateController::class, 'store']);
Route::patch('document-templates/{documentTemplate}', [DocumentTemplateController::class, 'update']);
Route::delete('document-templates/{documentTemplate}', [DocumentTemplateController::class, 'destroy']);
