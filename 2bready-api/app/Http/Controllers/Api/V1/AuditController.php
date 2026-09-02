<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Audit\Actions\AssignAuditorAction;
use App\Domain\Audit\Actions\CancelAuditAction;
use App\Domain\Audit\Actions\CreateAuditAction;
use App\Domain\Audit\Actions\ReviewAuditAction;
use App\Domain\Audit\Actions\SubmitAuditAction;
use App\Domain\Audit\DTOs\AuditData;
use App\Domain\Audit\DTOs\AuditDecisionData;
use App\Domain\Audit\Models\Audit;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Audit\AssignAuditorRequest;
use App\Http\Requests\Api\V1\Audit\ReviewAuditRequest;
use App\Http\Requests\Api\V1\Audit\StoreAuditRequest;
use App\Http\Requests\Api\V1\Audit\SubmitAuditRequest;
use App\Http\Resources\Api\V1\AuditResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Audit::class);

        /** @var User $user */
        $user = $request->user();

        // Admin/staff/finance see every company's audits (BelongsToCompany
        // bypasses for internal roles). A company_owner's query is scoped by
        // BelongsToCompany to their own company automatically. A TP/auditor is
        // never company-bypassed — the scope would match nothing — so their
        // branch resolves withoutGlobalScope('company') and is re-narrowed to
        // exactly this firm's active engagements (same pattern as
        // TpAssignmentController::myCompanies).
        $query = Audit::query()->with(['company', 'tpHire', 'tpPartner', 'auditor.user.companies']);

        if ($user->auditor) {
            $firmId = $user->auditor->tp_partner_id;
            $companyIds = TpHire::query()->withoutGlobalScope('company')
                ->where('tp_partner_id', $firmId)
                ->where('status', 'active')
                ->pluck('company_id');

            $query = $query->withoutGlobalScope('company')
                ->where(fn ($q) => $q->whereIn('company_id', $companyIds)->orWhere('auditor_id', $user->auditor->id));
        }

        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return ApiResponse::success(AuditResource::collection($query->latest()->get()));
    }

    public function show(string $audit): JsonResponse
    {
        // Resolved manually with withoutGlobalScope('company') — a TP/auditor
        // caller is never company-bypassed, so the scoped implicit binding
        // would 404 before AuditPolicy::view() ever ran (same reasoning as
        // TpHireController::complete).
        $audit = Audit::query()->withoutGlobalScope('company')
            ->with(['company', 'tpHire', 'tpPartner', 'auditor.user.companies', 'documents'])
            ->findOrFail($audit);

        $this->authorize('view', $audit);

        return ApiResponse::success(new AuditResource($audit));
    }

    public function store(StoreAuditRequest $request, CreateAuditAction $action): JsonResponse
    {
        $this->authorize('create', Audit::class);

        $audit = $action->execute(AuditData::from($request->validated()));

        return ApiResponse::created(new AuditResource($audit->load(['company', 'tpHire', 'tpPartner'])));
    }

    public function assign(string $audit, AssignAuditorRequest $request, AssignAuditorAction $action): JsonResponse
    {
        $audit = Audit::query()->withoutGlobalScope('company')->findOrFail($audit);
        $this->authorize('assign', $audit);

        $audit = $action->execute($audit, $request->validated('auditor_id'));

        return ApiResponse::success(new AuditResource($audit->load(['company', 'tpHire', 'tpPartner', 'auditor.user.companies'])));
    }

    public function submit(string $audit, SubmitAuditRequest $request, SubmitAuditAction $action): JsonResponse
    {
        $audit = Audit::query()->withoutGlobalScope('company')->findOrFail($audit);
        $this->authorize('submit', $audit);

        $audit = $action->execute($audit, AuditDecisionData::from($request->validated()));

        return ApiResponse::success(new AuditResource($audit->load(['company', 'tpHire', 'tpPartner', 'auditor.user.companies'])));
    }

    public function review(string $audit, ReviewAuditRequest $request, ReviewAuditAction $action): JsonResponse
    {
        $audit = Audit::query()->withoutGlobalScope('company')->findOrFail($audit);
        $this->authorize('review', $audit);

        $audit = $action->execute($audit, $request->validated('decision') === 'approved', $request->user());

        return ApiResponse::success(new AuditResource($audit->load(['company', 'tpHire', 'tpPartner', 'auditor.user.companies'])));
    }

    public function cancel(string $audit, CancelAuditAction $action): JsonResponse
    {
        $audit = Audit::query()->withoutGlobalScope('company')->findOrFail($audit);
        $this->authorize('cancel', $audit);

        $audit = $action->execute($audit);

        return ApiResponse::success(new AuditResource($audit->load(['company', 'tpHire', 'tpPartner'])));
    }
}
