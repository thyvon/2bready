<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Package\Actions\CreatePackageAction;
use App\Domain\Package\Actions\DeletePackageAction;
use App\Domain\Package\Actions\UpdatePackageAction;
use App\Domain\Package\DTOs\PackageData;
use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Package\Models\Package;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Package\StorePackageRequest;
use App\Http\Requests\Api\V1\Package\UpdatePackageRequest;
use App\Http\Resources\Api\V1\PackageGroupResource;
use App\Http\Resources\Api\V1\PublicPackageGroupResource;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class PackageController extends Controller
{
    // Unauthenticated — landing-page pricing. No $this->authorize() call here on
    // purpose: there's no logged-in user to check a policy against. Only active
    // packages are exposed, and PublicPackageGroupResource whitelists a narrow field set.
    // Optional ?industry=<code> scopes to that industry's own catalog — industry is
    // the top-level partition (see Industry domain), not a price override on a
    // shared list, so an unmatched/omitted code just returns industry-agnostic rows.
    //
    // Each journey level now has TWO Package rows (monthly + yearly); this
    // endpoint groups them so a visitor sees ONE package per level with its
    // price options nested, rather than two identical-looking cards. The
    // representative row is the yearly one (the headline offer), falling back
    // to whatever single row exists for that level.
    public function publicIndex(Request $request): JsonResponse
    {
        $query = Package::query()
            ->with(['industry', 'journeyLevel.milestones'])
            ->where('is_active', true)
            ->orderBy('sort_order');

        $this->scopeToIndustry($query, $request);

        return ApiResponse::success(PublicPackageGroupResource::collection($this->groupByLevel($query->get())));
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Package::class);

        $query = Package::query()->with(['industry', 'journeyLevel'])->orderBy('sort_order');

        if (! $request->user()->hasAnyRole(['admin', 'staff', 'finance'])) {
            $query->where('is_active', true);
        }

        $this->scopeToIndustry($query, $request);

        return ApiResponse::success(PackageGroupResource::collection($this->groupByLevel($query->get())));
    }

    public function store(StorePackageRequest $request, CreatePackageAction $action): JsonResponse
    {
        $this->authorize('create', Package::class);

        $package = $action->execute(PackageData::from($request->validated()));

        return ApiResponse::created(new PackageGroupResource($package));
    }

    public function show(Package $package): JsonResponse
    {
        $this->authorize('view', $package);

        $package->load(['industry', 'journeyLevel', 'siblingPrices']);
        $package->setRelation('prices', collect([$package->siblingPrices->values(), collect([$package])])
            ->flatten()
            ->sortBy(fn (Package $row) => $row->billing_period === BillingPeriod::Yearly)
            ->values());

        return ApiResponse::success(new PackageGroupResource($package));
    }

    public function update(UpdatePackageRequest $request, Package $package, UpdatePackageAction $action): JsonResponse
    {
        $this->authorize('update', $package);

        $package = $action->execute($package, $request->validated());

        return ApiResponse::success(new PackageGroupResource($package));
    }

    /** @param Builder<Package> $query */
    private function scopeToIndustry(Builder $query, Request $request): void
    {
        if ($request->filled('industry')) {
            $query->whereHas('industry', fn ($q) => $q->where('code', $request->string('industry')));
        }
    }

    /**
     * Groups the flat Package rows into one entry per journey level, attaching
     * the level's other billing-period rows as the `prices` relation on the
     * representative (yearly, else the single row). Packages without a
     * journey_level_id (future add-ons) stay as their own single-row group.
     *
     * @param  Collection<int, Package>  $packages
     * @return Collection<int, Package>
     */
    private function groupByLevel(Collection $packages): Collection
    {
        $grouped = $packages->groupBy(fn (Package $package) => $package->journey_level_id ?? 'package:'.$package->id);

        return $grouped->map(function (Collection $group) {
            $yearly = $group->first(fn (Package $package) => $package->billing_period === BillingPeriod::Yearly);

            /** @var Package $representative */
            $representative = $yearly ?? $group->first();

            $representative->setRelation('prices', $group->sortBy(fn (Package $package) => $package->billing_period === BillingPeriod::Yearly));

            return $representative;
        })->sortBy(fn (Package $package) => $package->sort_order)->values();
    }

    public function destroy(Package $package, DeletePackageAction $action): JsonResponse
    {
        $this->authorize('delete', $package);

        $action->execute($package);

        return ApiResponse::noContent();
    }
}
