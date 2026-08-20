<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\Sop\Actions\ActivateSopAction;
use App\Domain\Sop\Actions\CreateSopAction;
use App\Domain\Sop\Actions\DeleteSopAction;
use App\Domain\Sop\Actions\UnadoptSopAction;
use App\Domain\Sop\Actions\UpdateSopAction;
use App\Domain\Sop\Actions\UpsertSopAdoptionAction;
use App\Domain\Sop\DTOs\SopData;
use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Sop\AdoptSopRequest;
use App\Http\Requests\Api\V1\Sop\StoreSopRequest;
use App\Http\Requests\Api\V1\Sop\UpdateSopRequest;
use App\Http\Resources\Api\V1\SopResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SOP management — platform-wide templates (admin) + company-specific SOPs.
 *
 * Global SOPs (company_id = null): admin/staff create, update, activate, delete.
 * Company SOPs (company_id set): company_owner + admin/staff manage their own.
 * Adoption: company_owner adopts global SOP with optional overrides.
 */
class SopController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Sop::class);

        $query = Sop::query()->withoutGlobalScope('company')->with(['company', 'createdBy', 'adoptions.company']);

        // Admin/staff/finance see all SOPs; company users see only their company's
        if ($request->user()->hasAnyRole(['admin', 'staff', 'finance'])) {
            // No additional scope — BelongsToCompany handles company scoping
        } else {
            // Company users: their company's SOPs + global SOPs they've adopted
            $companyId = $request->user()->current_company_id;
            $query->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)
                    ->orWhere(function ($sub) use ($companyId) {
                        $sub->whereNull('company_id')
                            ->whereHas('adoptions', fn ($a) => $a->where('company_id', $companyId));
                    });
            });
        }

        // Filters
        if ($request->filled('title')) {
            $query->where('title', 'like', "%{$request->string('title')}%");
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        if ($request->filled('global_only')) {
            $query->whereNull('company_id');
        }

        $query->orderBy('title')->orderByDesc('version');

        return ApiResponse::success(SopResource::collection($query->get()));
    }

    public function store(StoreSopRequest $request, CreateSopAction $action): JsonResponse
    {
        $this->authorize('create', Sop::class);

        $companyId = $request->user()->hasRole('company_owner')
            ? $request->user()->current_company_id
            : $request->validated('company_id') ?? null;

        $sop = $action->execute(
            SopData::fromRequest([
                'title' => $request->validated('title'),
                'version' => $request->validated('version'),
                'content_en' => $request->validated('content_en'),
                'content_kh' => $request->validated('content_kh'),
                'effective_at' => $request->validated('effective_at'),
                'is_active' => $request->boolean('is_active'),
                'company_id' => $companyId,
            ]),
            $request->user(),
        );

        event(new AuditableActionOccurred(
            action: 'sop_created',
            companyId: $sop->company_id,
            auditableType: Sop::class,
            auditableId: $sop->id,
            changes: ['old' => null, 'new' => [
                'title' => $sop->title,
                'version' => $sop->version,
                'is_active' => $sop->is_active,
            ]],
        ));

        return ApiResponse::created(new SopResource($sop->load(['company', 'createdBy'])));
    }

    public function show(Sop $sop): JsonResponse
    {
        $this->authorize('view', $sop);

        return ApiResponse::success(new SopResource($sop->load(['company', 'createdBy', 'adoptions.company'])));
    }

    public function update(UpdateSopRequest $request, Sop $sop, UpdateSopAction $action): JsonResponse
    {
        $this->authorize('update', $sop);

        $sop = $action->execute($sop, $request->validated());

        event(new AuditableActionOccurred(
            action: 'sop_updated',
            companyId: $sop->company_id,
            auditableType: Sop::class,
            auditableId: $sop->id,
        ));

        return ApiResponse::success(new SopResource($sop->load(['company', 'createdBy'])));
    }

    public function destroy(Sop $sop, DeleteSopAction $action): JsonResponse
    {
        $this->authorize('delete', $sop);

        $companyId = $sop->company_id;
        $action->execute($sop);

        event(new AuditableActionOccurred(
            action: 'sop_deleted',
            companyId: $companyId,
            auditableType: Sop::class,
            auditableId: $sop->id,
        ));

        return ApiResponse::success(['deleted' => true]);
    }

    public function activate(Request $request, Sop $sop, ActivateSopAction $action): JsonResponse
    {
        $this->authorize('activate', $sop);

        $wasActive = $sop->is_active;
        $sop = $action->execute($sop, $request->boolean('active'));

        if ($wasActive !== $sop->is_active) {
            event(new AuditableActionOccurred(
                action: $sop->is_active ? 'sop_activated' : 'sop_deactivated',
                companyId: $sop->company_id,
                auditableType: Sop::class,
                auditableId: $sop->id,
            ));
        }

        return ApiResponse::success(new SopResource($sop));
    }

    public function adopt(AdoptSopRequest $request, Sop $sop, UpsertSopAdoptionAction $action): JsonResponse
    {
        $this->authorize('adopt', $sop);

        if ($sop->company_id !== null) {
            return ApiResponse::error('Only global SOPs can be adopted.', [], 422);
        }

        $adoption = $action->execute(
            $sop,
            $request->user()->current_company_id,
            $request->user(),
            $request->validated('override_content_en'),
            $request->validated('override_content_kh'),
        );

        event(new AuditableActionOccurred(
            action: 'sop_adopted',
            companyId: $request->user()->current_company_id,
            auditableType: Sop::class,
            auditableId: $sop->id,
            metadata: ['adoption_id' => $adoption->id],
        ));

        return ApiResponse::created([
            'sop_company' => $adoption->load('sop'),
        ]);
    }

    public function unadopt(Request $request, SopCompany $sopCompany, UnadoptSopAction $action): JsonResponse
    {
        // The adopted SOP is (almost always) a global template — load it without
        // the tenant scope, otherwise SopPolicy::adopt receives null for global SOPs.
        $sop = Sop::withoutGlobalScope('company')->find($sopCompany->sop_id);
        if (! $sop) {
            return ApiResponse::error('SOP not found.', [], 404);
        }

        $this->authorize('adopt', $sop);

        if ($sopCompany->company_id !== $request->user()->current_company_id) {
            return ApiResponse::error('You can only unadopt SOPs for your own company.', [], 403);
        }

        $action->execute($sopCompany);

        event(new AuditableActionOccurred(
            action: 'sop_unadopted',
            companyId: $sopCompany->company_id,
            auditableType: Sop::class,
            auditableId: $sopCompany->sop_id,
            metadata: ['adoption_id' => $sopCompany->id],
        ));

        return ApiResponse::success(['unadopted' => true]);
    }
}
