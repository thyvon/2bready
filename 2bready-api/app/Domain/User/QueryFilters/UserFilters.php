<?php

declare(strict_types=1);

namespace App\Domain\User\QueryFilters;

use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Builder;

class UserFilters
{
    /**
     * @param  Builder<User>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<User>
     */
    public static function apply(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['role'] ?? null, fn (Builder $q, string $role) => $q->whereHas(
                'roles',
                fn (Builder $q2) => $q2->where('name', $role),
            ))
            ->when($filters['status'] ?? null, fn (Builder $q, string $status) => $q->where('status', $status))
            ->when($filters['search'] ?? null, fn (Builder $q, string $search) => $q->where(function (Builder $q2) use ($search) {
                $q2->where('name', 'ilike', "%{$search}%")->orWhere('email', 'ilike', "%{$search}%");
            }));
    }
}
