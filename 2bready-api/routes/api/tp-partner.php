<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\TpAssignmentController;
use App\Http\Controllers\Api\V1\TpHireController;
use App\Http\Controllers\Api\V1\TpPartnerController;
use Illuminate\Support\Facades\Route;

// Admin CRUD — the firm itself + its staff (mirrors routes/api/company.php's
// shape). Split by policy/permission inside each controller, not by route
// tree, per this project's "one file per domain, not per portal" convention.
Route::prefix('tp-partners')->group(function () {
    Route::get('/', [TpPartnerController::class, 'index']);
    Route::post('/', [TpPartnerController::class, 'store']);
    Route::get('{tpPartner}', [TpPartnerController::class, 'show']);
    Route::patch('{tpPartner}', [TpPartnerController::class, 'update']);
    Route::delete('{tpPartner}', [TpPartnerController::class, 'destroy']);
    Route::get('{tpPartner}/auditors', [TpPartnerController::class, 'auditors']);
    Route::post('{tpPartner}/auditors', [TpPartnerController::class, 'registerAuditor']);
});

// Admin CRUD — the paid engagement (hire).
Route::prefix('tp-hires')->group(function () {
    Route::get('/', [TpHireController::class, 'index']);
    Route::post('/', [TpHireController::class, 'store']);
    Route::post('{tpHire}/complete', [TpHireController::class, 'complete']);
    Route::post('{tpHire}/mark-paid-out', [TpHireController::class, 'markPaidOut']);
});

// TP-self — "which companies am I actively engaged for" (tp-portal's own
// companies list + per-company Journey review screen).
Route::prefix('tp')->group(function () {
    Route::get('companies', [TpAssignmentController::class, 'myCompanies']);
    Route::get('companies/{company}/journey', [TpAssignmentController::class, 'companyJourney']);
});
