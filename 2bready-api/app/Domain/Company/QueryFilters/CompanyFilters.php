<?php

declare(strict_types=1);

namespace App\Domain\Company\QueryFilters;

use App\Domain\Company\Models\Company;
use Illuminate\Database\Eloquent\Builder;

class CompanyFilters
{
    /**
     * @param  Builder<Company>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<Company>
     */
    public static function apply(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['status'] ?? null, fn (Builder $q, string $status) => $q->where('status', $status))
            ->when($filters['country_code'] ?? null, fn (Builder $q, string $code) => $q->where('country_code', $code))
            ->when($filters['industry_id'] ?? null, fn (Builder $q, string $id) => $q->where('industry_id', $id))
            ->when($filters['search'] ?? null, fn (Builder $q, string $search) => $q->where(function (Builder $q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")->orWhere('name_kh', 'ilike', "%{$search}%");
            }));
    }
}
