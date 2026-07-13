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
use App\Http\Resources\Api\V1\PublicPackageResource;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    // Unauthenticated — landing-page pricing. No $this->authorize() call here on
    // purpose: there's no logged-in user to check a policy against. Only active
    // packages are exposed, and PublicPackageResource whitelists a narrow field set.
    // Optional ?industry=<code> scopes to that industry's own catalog — industry is
    // the top-level partition (see Industry domain), not a price override on a
    // shared list, so an unmatched/omitted code just returns industry-agnostic rows.
    public function publicIndex(Request $request): JsonResponse
    {
        $query = Package::query()
            ->with(['industry', 'journeyLevel'])
            ->where('is_active', true)
            ->orderBy('sort_order');

        $this->scopeToIndustry($query, $request);

        return ApiResponse::success(PublicPackageResource::collection($query->get()));
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Package::class);

        $query = Package::query()->with(['industry', 'journeyLevel'])->orderBy('sort_order');

        if (! $request->user()->hasAnyRole(['admin', 'staff', 'finance'])) {
            $query->where('is_active', true);
        }

        $this->scopeToIndustry($query, $request);

        return ApiResponse::success(PackageResource::collection($query->get()));
    }

    /** @param Builder<Package> $query */
    private function scopeToIndustry(Builder $query, Request $request): void
    {
        if ($request->filled('industry')) {
            $query->whereHas('industry', fn ($q) => $q->where('code', $request->string('industry')));
        }
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
