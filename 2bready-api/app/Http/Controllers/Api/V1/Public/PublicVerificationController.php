<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\PublicVerification\Actions\VerifyCertificateAction;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * The unauthenticated certificate verification surface (v3 §1.5/§1.6) — the
 * destination of every QR code the platform issues. No auth:sanctum, no
 * tenant scope: VerifyCertificateAction reads only the narrow certificates
 * table by audit_id and returns only certificate-safe fields. This route is
 * separately throttled and cacheable (certificates don't change after
 * issuance), so QR scans never hit the authenticated API surface.
 */
class PublicVerificationController extends Controller
{
    public function verify(string $auditId, VerifyCertificateAction $action): JsonResponse
    {
        $certificate = $action->execute($auditId);

        if (! $certificate) {
            return ApiResponse::error('Certificate not found for this audit.', [], 404);
        }

        return ApiResponse::success($certificate);
    }
}
