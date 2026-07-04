<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\LeadController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    require __DIR__.'/api/auth.php';

    // Public — a lead may come from an anonymous marketing-site visitor, not just an
    // authenticated company_owner hitting an in-app paywall. Listing leads (for sales
    // followup) is authenticated and lives in routes/api/payment.php instead.
    Route::post('leads', [LeadController::class, 'store']);

    // totp.verified blocks tokens issued mid-2FA-flow (see AuthController::login()) from
    // reaching business routes — pending tokens only carry the 'totp-pending' ability.
    Route::middleware(['auth:sanctum', 'totp.verified'])->group(function () {
        require __DIR__.'/api/company.php';
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
