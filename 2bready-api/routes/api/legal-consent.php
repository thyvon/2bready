<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\LegalConsentController;
use Illuminate\Support\Facades\Route;

// Client-side legal consent (v3 §4.2/§5.1) — status + accept for restricted
// P3/P4 (L3/L4) document actions. Scoped to the caller's own company
// (current_company_id) — company_owner/member only; the Vault covers
// back-office review of the same documents.
Route::prefix('legal-consent')->group(function () {
    Route::get('status', [LegalConsentController::class, 'status'])->middleware('permission:document.upload');
    Route::post('accept', [LegalConsentController::class, 'accept'])->middleware('permission:document.upload');
});
