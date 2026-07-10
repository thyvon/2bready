<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Industry\Actions\CreateIndustryAction;
use App\Domain\Industry\Actions\DeleteIndustryAction;
use App\Domain\Industry\Actions\UpdateIndustryAction;
use App\Domain\Industry\DTOs\IndustryData;
use App\Domain\Industry\Models\Industry;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Industry\StoreIndustryRequest;
use App\Http\Requests\Api\V1\Industry\UpdateIndustryRequest;
use App\Http\Resources\Api\V1\IndustryResource;
use App\Http\Resources\Api\V1\PublicIndustryResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IndustryController extends Controller
{
    // Unauthenticated — client-portal's onboarding wizard runs before any
    // login/auth session exists there today, so it can't reach the
    // authenticated index() below. Mirrors PackageController::publicIndex().
    public function publicIndex(): JsonResponse
    {
        $industries = Industry::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success(PublicIndustryResource::collection($industries));
    }

    // Every authenticated user (any role) can reach this — a company_owner
    // needs the list to fill out the setup wizard's industry dropdown, not
    // just admin/staff. Non-admin/staff/finance only ever sees active rows,
    // same filtering rule as PackageController::index().
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Industry::class);

        $query = Industry::query()->orderBy('sort_order');

        if (! $request->user()->hasAnyRole(['admin', 'staff', 'finance'])) {
            $query->where('is_active', true);
        }

        return ApiResponse::success(IndustryResource::collection($query->get()));
    }

    public function store(StoreIndustryRequest $request, CreateIndustryAction $action): JsonResponse
    {
        $this->authorize('create', Industry::class);

        $industry = $action->execute(IndustryData::from($request->validated()));

        return ApiResponse::created(new IndustryResource($industry));
    }

    public function show(Industry $industry): JsonResponse
    {
        $this->authorize('view', $industry);

        return ApiResponse::success(new IndustryResource($industry));
    }

    public function update(UpdateIndustryRequest $request, Industry $industry, UpdateIndustryAction $action): JsonResponse
    {
        $this->authorize('update', $industry);

        $industry = $action->execute($industry, $request->validated());

        return ApiResponse::success(new IndustryResource($industry));
    }

    public function destroy(Industry $industry, DeleteIndustryAction $action): JsonResponse
    {
        $this->authorize('delete', $industry);

        $action->execute($industry);

        return ApiResponse::noContent();
    }
}
