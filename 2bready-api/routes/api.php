<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\BrandingController;
use App\Http\Controllers\Api\V1\IndustryController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\PackageController;
use App\Http\Controllers\Api\V1\Public\PublicVerificationController;
use App\Http\Controllers\Api\V1\PublicDataRoomController;
use Illuminate\Support\Facades\Route;

// Health check endpoint — no auth, no middleware, used by Docker + Cloudflare Tunnel
Route::get('health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});

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

    // Public — a Smart Data Room link's token + PIN IS the credential, there
    // is no Sanctum token at all on this path (see
    // VerifyDataRoomAccessAction/PublicDataRoomController). Authenticated
    // create/show/revoke for the company owner lives in routes/api/data-room.php
    // instead, inside the protected group below.
    Route::post('data-room/{token}/verify', [PublicDataRoomController::class, 'verify'])
        ->middleware('throttle:data-room.pin');
    Route::get('data-room/{token}/documents/{document}/preview-url', [PublicDataRoomController::class, 'previewUrl']);

    // Public — the platform logo is shown by every portal (admin, client,
    // TP, marketing) and none of them share a permission level; the logos
    // themselves are private assets served via fresh signed URLs, never a
    // public bucket. Upload/remove are admin-only and live in
    // routes/api/settings.php. `branding` returns all four slots
    // (light/dark/footer/footerDark) in one request; `branding/logo` is the
    // original single-slot endpoint, kept for compatibility.
    Route::get('branding', [BrandingController::class, 'branding']);
    Route::get('branding/logo', [BrandingController::class, 'logo']);

    // Public — the certificate verify page the QR codes encode. Reads only
    // the narrow certificates table by audit_id (v3 §1.5), never the
    // authenticated tenant surface. Certificates don't change after issuance,
    // so this is independently throttled and CDN-cacheable.
    Route::get('public/verify/{auditId}', [PublicVerificationController::class, 'verify'])
        ->middleware('throttle:60,1');

    // totp.verified blocks tokens issued mid-2FA-flow (see AuthController::login()) from
    // reaching business routes — pending tokens only carry the 'totp-pending' ability.
    // company.active rejects requests from a user whose current company is
    // suspended/inactive (EnsureCompanyIsActive) — a no-op for internal
    // admin/staff/finance/auditor accounts, which never have a current company.
    // email.verified rejects a password-registered account that hasn't clicked its
    // verification link yet — a no-op for internal accounts (CreateInternalUserAction)
    // and Google-linked accounts (HandleGoogleCallbackAction), both of which stamp
    // email_verified_at at creation time.
    Route::middleware(['auth:sanctum', 'totp.verified', 'company.active', 'email.verified'])->group(function () {
        require __DIR__.'/api/company.php';
        require __DIR__.'/api/industry.php';
        require __DIR__.'/api/user.php';
        require __DIR__.'/api/package.php';
        require __DIR__.'/api/payment.php';
        require __DIR__.'/api/journey.php';
        require __DIR__.'/api/document.php';
        require __DIR__.'/api/audit.php';
        require __DIR__.'/api/data-room.php';
        require __DIR__.'/api/signoff-documents.php';
        require __DIR__.'/api/notification.php';
        require __DIR__.'/api/support.php';
        require __DIR__.'/api/report.php';
        require __DIR__.'/api/audit-log.php';
        require __DIR__.'/api/settings.php';
        require __DIR__.'/api/profile.php';
        require __DIR__.'/api/tp-partner.php';
        require __DIR__.'/api/vault.php';
        require __DIR__.'/api/legal-consent.php';
        require __DIR__.'/api/trust-badges.php';
    });
});
