<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Repositories;

use App\Domain\TpPartner\Contracts\TpPartnerRepositoryInterface;
use App\Domain\TpPartner\Models\TpPartner;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentTpPartnerRepository implements TpPartnerRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, TpPartner>
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = TpPartner::query();

        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($search = $filters['search'] ?? null) {
            $query->where('name', 'ilike', "%{$search}%");
        }

        return $query->latest()->paginate($perPage);
    }

    public function findOrFail(string $id): TpPartner
    {
        return TpPartner::query()->findOrFail($id);
    }
}
