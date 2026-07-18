<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\AuditLog\Models\AuditLog;
use App\Domain\AuditLog\QueryFilters\AuditLogFilters;
use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AuditLogResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only on purpose — AuditLog has no store/update/destroy anywhere, ever
 * (see AuditLog model). Entries only ever come from RecordAuditLogListener.
 */
class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        /** @var User $user */
        $user = $request->user();
        $filters = $request->only(['action', 'auditable_type', 'user_id', 'company_id', 'from', 'to', 'search']);

        // Internal roles (admin/staff/finance) see across every company — the same
        // bypass BelongsToCompany uses elsewhere. Everyone else with audit_log.view
        // (company_owner today; auditor too, pending a real "assigned companies"
        // model) is hard-scoped to their own current company: never let a
        // company_id filter they pass override this, or one company could read
        // another's history just by supplying a different id.
        if (! $user->hasAnyRole(['admin', 'staff', 'finance'])) {
            $filters['company_id'] = $user->current_company_id;
        }

        $logs = AuditLogFilters::apply(AuditLog::query(), $filters)
            ->latest('created_at')
            ->paginate(25);

        return ApiResponse::success(
            AuditLogResource::collection($logs->items()),
            ['pagination' => [
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
            ]],
        );
    }
}
