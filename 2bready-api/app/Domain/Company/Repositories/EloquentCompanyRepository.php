<?php

declare(strict_types=1);

namespace App\Domain\Company\Repositories;

use App\Domain\Company\Contracts\CompanyRepositoryInterface;
use App\Domain\Company\Models\Company;
use App\Domain\Company\QueryFilters\CompanyFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentCompanyRepository implements CompanyRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, Company>
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return CompanyFilters::apply(Company::query()->with('industry'), $filters)
            ->latest()
            ->paginate($perPage);
    }

    public function findOrFail(string $id): Company
    {
        return Company::query()->findOrFail($id);
    }
}
