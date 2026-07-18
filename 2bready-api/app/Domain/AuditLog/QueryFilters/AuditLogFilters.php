<?php

declare(strict_types=1);

namespace App\Domain\AuditLog\QueryFilters;

use App\Domain\AuditLog\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;

class AuditLogFilters
{
    /**
     * @param  Builder<AuditLog>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<AuditLog>
     */
    public static function apply(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['action'] ?? null, fn (Builder $q, string $action) => $q->where('action', 'ilike', "{$action}%"))
            ->when($filters['auditable_type'] ?? null, fn (Builder $q, string $type) => $q->where('auditable_type', $type))
            ->when($filters['user_id'] ?? null, fn (Builder $q, string $userId) => $q->where('user_id', $userId))
            ->when($filters['company_id'] ?? null, fn (Builder $q, string $companyId) => $q->where('company_id', $companyId))
            ->when($filters['from'] ?? null, fn (Builder $q, string $from) => $q->where('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn (Builder $q, string $to) => $q->where('created_at', '<=', $to))
            ->when($filters['search'] ?? null, fn (Builder $q, string $search) => $q->where('actor_email', 'ilike', "%{$search}%"));
    }
}
