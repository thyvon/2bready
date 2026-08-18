<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\TrustBadge\Models\TrustBadge;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\TrustBadgeResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Trust badges for the current company — the client portal's "my badges"
 * list. Company users see their own (via BelongsToCompany); internal
 * admin/staff/finance bypass the scope and see all badges (role-based, the
 * same back-office cross-tenant pattern as every other admin list). The
 * public verification surface is a separate, unauthenticated path
 * (PublicVerificationController).
 */
class TrustBadgeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $badges = TrustBadge::query()
            ->with('certificate')
            ->orderByDesc('issued_at')
            ->get();

        return ApiResponse::success(TrustBadgeResource::collection($badges));
    }
}
