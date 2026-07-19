<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\IndustryController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\PackageController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    require __DIR__.'/api/auth.php';

    // Public — a lead may come from an anonymous marketing-site visitor, not just an
    // authenticated company_owner hitting an in-app paywall. Listing leads (for sales
    // followup) is authenticated and lives in routes/api/payment.php instead.
    Route::post('leads', [LeadController::class, 'store']);

    // Public — anonymous landing-page visitors need to see pricing before they
    // register. Full package management (store/update/destroy) and the internal
    // listing endpoint stay protected in routes/api/package.php.
    Route::get('pricing', [PackageController::class, 'publicIndex']);

    // Public — client-portal's onboarding wizard needs this before any auth session
    // exists there. Distinct name from the authenticated `industries` listing in
    // routes/api/industry.php (same reasoning as `pricing` vs `packages` above) so
    // the two don't collide on the same URI.
    Route::get('industry-options', [IndustryController::class, 'publicIndex']);

    // totp.verified blocks tokens issued mid-2FA-flow (see AuthController::login()) from
    // reaching business routes — pending tokens only carry the 'totp-pending' ability.
    // company.active rejects requests from a user whose current company is
    // suspended/inactive (EnsureCompanyIsActive) — a no-op for internal
    // admin/staff/finance/auditor accounts, which never have a current company.
    Route::middleware(['auth:sanctum', 'totp.verified', 'company.active'])->group(function () {
        require __DIR__.'/api/company.php';
        require __DIR__.'/api/industry.php';
        require __DIR__.'/api/user.php';
        require __DIR__.'/api/package.php';
        require __DIR__.'/api/payment.php';
        require __DIR__.'/api/journey.php';
        require __DIR__.'/api/document.php';
        require __DIR__.'/api/audit.php';
        require __DIR__.'/api/data-room.php';
        require __DIR__.'/api/notification.php';
        require __DIR__.'/api/support.php';
        require __DIR__.'/api/sop.php';
        require __DIR__.'/api/report.php';
        require __DIR__.'/api/audit-log.php';
        require __DIR__.'/api/settings.php';
    });
});
