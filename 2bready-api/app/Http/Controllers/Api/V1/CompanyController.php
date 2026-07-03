<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Actions\CreateCompanyAction;
use App\Domain\Company\Actions\DeleteCompanyAction;
use App\Domain\Company\Actions\UpdateCompanyAction;
use App\Domain\Company\Contracts\CompanyRepositoryInterface;
use App\Domain\Company\DTOs\CompanyData;
use App\Domain\Company\Models\Company;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Company\StoreCompanyRequest;
use App\Http\Requests\Api\V1\Company\UpdateCompanyRequest;
use App\Http\Resources\Api\V1\CompanyResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(Request $request, CompanyRepositoryInterface $repository): JsonResponse
    {
        $this->authorize('viewAny', Company::class);

        $companies = $repository->paginate($request->only(['status', 'country_code', 'industry_code', 'search']));

        return ApiResponse::success(
            CompanyResource::collection($companies->items()),
            ['pagination' => [
                'total' => $companies->total(),
                'per_page' => $companies->perPage(),
                'current_page' => $companies->currentPage(),
                'last_page' => $companies->lastPage(),
            ]],
        );
    }

    public function store(StoreCompanyRequest $request, CreateCompanyAction $action): JsonResponse
    {
        $this->authorize('create', Company::class);

        $company = $action->execute(CompanyData::from($request->validated()));

        return ApiResponse::created(new CompanyResource($company));
    }

    public function show(Company $company): JsonResponse
    {
        $this->authorize('view', $company);

        return ApiResponse::success(new CompanyResource($company));
    }

    public function update(UpdateCompanyRequest $request, Company $company, UpdateCompanyAction $action): JsonResponse
    {
        $this->authorize('update', $company);

        $company = $action->execute($company, $request->validated());

        return ApiResponse::success(new CompanyResource($company));
    }

    public function destroy(Company $company, DeleteCompanyAction $action): JsonResponse
    {
        $this->authorize('delete', $company);

        $action->execute($company);

        return ApiResponse::noContent();
    }
}
