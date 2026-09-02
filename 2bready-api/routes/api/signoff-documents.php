<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\MySignoffDocumentController;
use App\Http\Controllers\Api\V1\SignOffDocumentController;
use Illuminate\Support\Facades\Route;

// Signed-off Documents — client-uploaded files, platform-verified, then
// emailed to staff for read & acknowledge. One endpoint set for both
// portals: BelongsToCompany scopes company users to their own rows;
// internal roles see the verification queue (policy-gated powers).
Route::prefix('signoff-documents')->group(function () {
    Route::get('/', [SignOffDocumentController::class, 'index']);
    Route::get('verified-journey-documents', [SignOffDocumentController::class, 'verifiedJourneyDocuments']);
    Route::post('/', [SignOffDocumentController::class, 'store'])->middleware('permission:portal.client.access');
    Route::get('{document}', [SignOffDocumentController::class, 'show']);
    Route::delete('{document}', [SignOffDocumentController::class, 'destroy']);
    Route::post('{document}/verify', [SignOffDocumentController::class, 'verify']);
    Route::post('{document}/reject', [SignOffDocumentController::class, 'reject']);
    Route::post('{document}/send', [SignOffDocumentController::class, 'send']);
    Route::post('send-journey-document/{documentId}', [SignOffDocumentController::class, 'sendJourneyDocument']);
});

// Staff side — "shared with me" + acknowledge. Numeric param bound by hand
// in the controller (scoped to the caller), not route-model binding.
Route::get('my-signoff-documents', [MySignoffDocumentController::class, 'index']);
Route::post('my-signoff-documents/{signoffDocumentUserId}/acknowledge', [MySignoffDocumentController::class, 'acknowledge']);
