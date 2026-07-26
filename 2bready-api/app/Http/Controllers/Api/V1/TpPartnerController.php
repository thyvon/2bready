<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\TpPartner\Actions\RegisterTpAuditorAction;
use App\Domain\TpPartner\Actions\RegisterTpPartnerAction;
use App\Domain\TpPartner\Contracts\TpPartnerRepositoryInterface;
use App\Domain\TpPartner\DTOs\RegisterAuditorData;
use App\Domain\TpPartner\DTOs\TpPartnerData;
use App\Domain\TpPartner\Models\TpPartner;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\TpPartner\RegisterAuditorRequest;
use App\Http\Requests\Api\V1\TpPartner\StoreTpPartnerRequest;
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

        $tpPartners = $repository->paginate($request->only(['status', 'search']));

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

    public function auditors(TpPartner $tpPartner): JsonResponse
    {
        $this->authorize('view', $tpPartner);

        return ApiResponse::success(UserResource::collection($tpPartner->auditors()->with('user')->get()->pluck('user')));
    }

    public function registerAuditor(TpPartner $tpPartner, RegisterAuditorRequest $request, RegisterTpAuditorAction $action): JsonResponse
    {
        $this->authorize('manageAuditors', $tpPartner);

        $user = $action->execute($tpPartner, RegisterAuditorData::from($request->validated()));

        return ApiResponse::created(new UserResource($user));
    }
}
