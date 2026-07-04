<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Package\Actions\CreatePackageAction;
use App\Domain\Package\Actions\DeletePackageAction;
use App\Domain\Package\Actions\UpdatePackageAction;
use App\Domain\Package\DTOs\PackageData;
use App\Domain\Package\Models\Package;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Package\StorePackageRequest;
use App\Http\Requests\Api\V1\Package\UpdatePackageRequest;
use App\Http\Resources\Api\V1\PackageResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Package::class);

        $query = Package::query()->orderBy('sort_order');

        // Non-internal users (company_owner/member choosing a plan) only ever see
        // active, sellable packages — retired plans stay visible to staff for
        // historical/reporting reasons only.
        if (! $request->user()->hasAnyRole(['admin', 'staff', 'finance'])) {
            $query->where('is_active', true);
        }

        return ApiResponse::success(PackageResource::collection($query->get()));
    }

    public function store(StorePackageRequest $request, CreatePackageAction $action): JsonResponse
    {
        $this->authorize('create', Package::class);

        $package = $action->execute(PackageData::from($request->validated()));

        return ApiResponse::created(new PackageResource($package));
    }

    public function show(Package $package): JsonResponse
    {
        $this->authorize('view', $package);

        return ApiResponse::success(new PackageResource($package));
    }

    public function update(UpdatePackageRequest $request, Package $package, UpdatePackageAction $action): JsonResponse
    {
        $this->authorize('update', $package);

        $package = $action->execute($package, $request->validated());

        return ApiResponse::success(new PackageResource($package));
    }

    public function destroy(Package $package, DeletePackageAction $action): JsonResponse
    {
        $this->authorize('delete', $package);

        $action->execute($package);

        return ApiResponse::noContent();
    }
}
