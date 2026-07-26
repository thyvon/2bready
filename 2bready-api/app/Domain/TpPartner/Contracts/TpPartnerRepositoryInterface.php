<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Contracts;

use App\Domain\TpPartner\Models\TpPartner;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TpPartnerRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, TpPartner>
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function findOrFail(string $id): TpPartner;
}
