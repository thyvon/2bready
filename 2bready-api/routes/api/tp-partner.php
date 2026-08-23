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
    // Sprint 7 onboarding approval — pending_approval → active (admin only).
    Route::post('{tpPartner}/approve', [TpPartnerController::class, 'approve']);
    Route::patch('{tpPartner}/pricing', [TpPartnerController::class, 'updatePricing']);
    Route::patch('{tpPartner}/profile', [TpPartnerController::class, 'updateProfile']);
    Route::delete('{tpPartner}', [TpPartnerController::class, 'destroy']);
    Route::get('{tpPartner}/auditors', [TpPartnerController::class, 'auditors']);
    Route::post('{tpPartner}/auditors', [TpPartnerController::class, 'registerAuditor']);
});

// Self-service — a company_owner hires and pays for a firm themselves. Kept
// as its own route (not inside the tp-hires prefix group below) to keep it
// visually distinct from the admin CRUD it sits next to.
Route::post('tp-hires/hire', [TpHireController::class, 'hire']);

// Admin CRUD — the paid engagement (hire). store() stays admin-only
// (marketplace.manage) — kept as a support/offline-sales override alongside
// the self-service hire() route above, which is the main path.
Route::prefix('tp-hires')->group(function () {
    Route::get('/', [TpHireController::class, 'index']);
    Route::post('/', [TpHireController::class, 'store']);
    // Pre-payment correction only (TpHirePolicy::update) — level changes
    // re-snapshot the price trio while the hire is still pending_payment.
    Route::patch('{tpHire}', [TpHireController::class, 'update']);
    Route::post('{tpHire}/complete', [TpHireController::class, 'complete']);
    Route::post('{tpHire}/mark-paid-out', [TpHireController::class, 'markPaidOut']);
    // Marketplace self-service: the company_owner's unhire + rating flows
    // (TpHirePolicy::cancel / ::rate) — sit next to complete() so the whole
    // hire lifecycle lives in one place.
    Route::post('{tpHire}/cancel', [TpHireController::class, 'cancel']);
    Route::post('{tpHire}/rate', [TpHireController::class, 'rate']);
});

// TP-self — "which companies am I actively engaged for" (tp-portal's own
// companies list + per-company Journey review screen).
Route::prefix('tp')->group(function () {
    Route::get('me', [TpAssignmentController::class, 'me']);
    Route::get('companies', [TpAssignmentController::class, 'myCompanies']);
    Route::get('companies/{company}/journey', [TpAssignmentController::class, 'companyJourney']);
});
