<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\TpPartner\Actions\ApproveTpPartnerAction;
use App\Domain\TpPartner\Actions\DeleteTpPartnerAction;
use App\Domain\TpPartner\Actions\RegisterTpAuditorAction;
use App\Domain\TpPartner\Actions\RegisterTpPartnerAction;
use App\Domain\TpPartner\Actions\UpdateTpPartnerPricingAction;
use App\Domain\TpPartner\Actions\UpdateTpPartnerProfileAction;
use App\Domain\TpPartner\Contracts\TpPartnerRepositoryInterface;
use App\Domain\TpPartner\DTOs\RegisterAuditorData;
use App\Domain\TpPartner\DTOs\TpPartnerData;
use App\Domain\TpPartner\Enums\TpPartnerStatus;
use App\Domain\TpPartner\Models\TpPartner;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\TpPartner\RegisterAuditorRequest;
use App\Http\Requests\Api\V1\TpPartner\StoreTpPartnerRequest;
use App\Http\Requests\Api\V1\TpPartner\UpdateTpPartnerPricingRequest;
use App\Http\Requests\Api\V1\TpPartner\UpdateTpPartnerProfileRequest;
use App\Http\Requests\Api\V1\TpPartner\UpdateTpPartnerRequest;
use App\Http\Resources\Api\V1\TpPartnerResource;
use App\Http\Resources\Api\V1\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TpPartnerController extends Controller
{
    public function index(Request $request, TpPartnerRepositoryInterface $repository): JsonResponse
    {
        $this->authorize('viewAny', TpPartner::class);

        $filters = $request->only(['status', 'search']);

        // Company-side browse (company_owner picking a firm to hire) never
        // sees suspended firms and can't override that via ?status= — only
        // admin/staff/finance may filter by status at all, mirroring
        // PackageController::index()'s is_active gate for non-internal callers.
        if (! $request->user()->hasAnyRole(['admin', 'staff', 'finance'])) {
            $filters['status'] = TpPartnerStatus::Active->value;
        }

        $tpPartners = $repository->paginate($filters);

        return ApiResponse::success(
            TpPartnerResource::collection($tpPartners->items()),
            ['pagination' => [
                'total' => $tpPartners->total(),
                'per_page' => $tpPartners->perPage(),
                'current_page' => $tpPartners->currentPage(),
                'last_page' => $tpPartners->lastPage(),
            ]],
        );
    }

    public function store(StoreTpPartnerRequest $request, RegisterTpPartnerAction $action): JsonResponse
    {
        $this->authorize('create', TpPartner::class);

        $tpPartner = $action->execute(TpPartnerData::from($request->validated()));

        return ApiResponse::created(new TpPartnerResource($tpPartner));
    }

    // Sprint 7 onboarding approval — pending_approval → active. Scoped
    // implicit binding is fine: only internal admins pass the policy.
    public function approve(TpPartner $tpPartner, ApproveTpPartnerAction $action): JsonResponse
    {
        $this->authorize('approve', $tpPartner);

        $tpPartner = $action->execute($tpPartner);

        return ApiResponse::success(new TpPartnerResource($tpPartner));
    }

    public function show(TpPartner $tpPartner): JsonResponse
    {
        $this->authorize('view', $tpPartner);

        return ApiResponse::success(new TpPartnerResource($tpPartner));
    }

    public function update(UpdateTpPartnerRequest $request, TpPartner $tpPartner): JsonResponse
    {
        $this->authorize('update', $tpPartner);

        $tpPartner->update($request->validated());

        return ApiResponse::success(new TpPartnerResource($tpPartner));
    }

    public function updatePricing(UpdateTpPartnerPricingRequest $request, TpPartner $tpPartner, UpdateTpPartnerPricingAction $action): JsonResponse
    {
        $this->authorize('updatePricing', $tpPartner);

        $tpPartner = $action->execute($tpPartner, $request->validated());

        return ApiResponse::success(new TpPartnerResource($tpPartner));
    }

    public function updateProfile(UpdateTpPartnerProfileRequest $request, TpPartner $tpPartner, UpdateTpPartnerProfileAction $action): JsonResponse
    {
        $this->authorize('updateProfile', $tpPartner);

        $tpPartner = $action->execute($tpPartner, $request->validated());

        return ApiResponse::success(new TpPartnerResource($tpPartner));
    }

    public function destroy(TpPartner $tpPartner, DeleteTpPartnerAction $action): JsonResponse
    {
        $this->authorize('delete', $tpPartner);

        $action->execute($tpPartner);

        return ApiResponse::noContent();
    }

    public function auditors(TpPartner $tpPartner): JsonResponse
    {
        $this->authorize('view', $tpPartner);

        return ApiResponse::success(UserResource::collection($tpPartner->auditors()->with(['user.auditor', 'user.companies'])->get()->pluck('user')));
    }

    public function registerAuditor(TpPartner $tpPartner, RegisterAuditorRequest $request, RegisterTpAuditorAction $action): JsonResponse
    {
        $this->authorize('manageAuditors', $tpPartner);

        $user = $action->execute($tpPartner, RegisterAuditorData::from($request->validated()));

        return ApiResponse::created(new UserResource($user->load('companies')));
    }
}
