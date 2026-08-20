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

    Route::post('{sop}/activate', [SopController::class, 'activate'])->middleware('permission:sop.manage');

    // Adoption: company_owner adopts a global SOP for their company
    Route::post('{sop}/adopt', [SopController::class, 'adopt'])->middleware('permission:sop.manage');

    // Unadopt: remove company's adoption of a global SOP
    Route::delete('sop-companies/{sopCompany}', [SopController::class, 'unadopt'])->middleware('permission:sop.manage');
});
