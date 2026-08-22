<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\SopController;
use Illuminate\Support\Facades\Route;

// SOPs — platform-wide templates (admin/staff) + company-specific SOPs
// (company_owner + admin/staff). Company users view their company's SOPs
// and global SOPs they've adopted.
Route::prefix('sops')->group(function () {
    Route::get('/', [SopController::class, 'index'])->middleware('permission:sop.view');
    Route::post('/', [SopController::class, 'store'])->middleware('permission:sop.manage');

    Route::get('{sop}', [SopController::class, 'show'])->middleware('permission:sop.view');
    Route::put('{sop}', [SopController::class, 'update'])->middleware('permission:sop.manage');
    Route::delete('{sop}', [SopController::class, 'destroy'])->middleware('permission:sop.manage');

    // Effective content: the company's adoption override when present, else the
    // SOP's own content — what a company member actually reads and follows.
    Route::get('{sop}/effective-content', [SopController::class, 'effectiveContent'])->middleware('permission:sop.view');

    // A4 PDF rendering for the detail page's embedded viewer and download
    Route::get('{sop}/pdf', [SopController::class, 'pdf'])->middleware('permission:sop.view');

    Route::post('{sop}/activate', [SopController::class, 'activate'])->middleware('permission:sop.manage');

    // Adoption: company_owner adopts a global SOP for their company
    Route::post('{sop}/adopt', [SopController::class, 'adopt'])->middleware('permission:sop.manage');

    // ─── Sign-offs (v3 Sprint 8: read & acknowledge workflow) ──────────────

    // Tracking list: every employee assigned to this SOP and their status
    Route::get('{sop}/signoffs', [SopController::class, 'signoffIndex'])->middleware('permission:sop.view');

    // Assign employees (of the current company) to read & acknowledge
    Route::post('{sop}/signoffs', [SopController::class, 'signoffStore'])->middleware('permission:sop.manage');

    // Unadopt: remove company's adoption of a global SOP
    Route::delete('sop-companies/{sopCompany}', [SopController::class, 'unadopt'])->middleware('permission:sop.manage');
});

// Sign-off acknowledgment is a top-level resource action (a SopSignoff is
// addressed directly, not nested under its SOP).
Route::post('signoffs/{signoff}/acknowledge', [SopController::class, 'signoffAcknowledge'])
    ->middleware('permission:sop.view');

// The current employee's own sign-offs across all SOPs ("pending acknowledgments").
Route::get('signoffs/mine', [SopController::class, 'signoffMine'])
    ->middleware('permission:sop.view');
