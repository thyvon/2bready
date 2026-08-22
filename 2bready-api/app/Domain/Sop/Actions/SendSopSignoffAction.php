<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopSignoff;
use App\Domain\User\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Assigns an SOP to employees for read-&-acknowledge sign-off (v3 Sprint 8).
 *
 * Employees must belong to the assigning company. One row per (sop, user):
 * re-sending to an already-assigned employee keeps their existing record and
 * its acknowledgment state instead of resetting it.
 *
 * @param  list<string>  $userIds
 * @return Collection<int, SopSignoff> All of the SOP's sign-offs after sending.
 */
class SendSopSignoffAction
{
    /**
     * @param  list<string>  $userIds
     * @return Collection<int, SopSignoff>
     */
    public function execute(Sop $sop, string $companyId, array $userIds, User $sentBy): Collection
    {
        return DB::transaction(function () use ($sop, $companyId, $userIds, $sentBy) {
            foreach ($userIds as $userId) {
                SopSignoff::query()->firstOrCreate(
                    ['sop_id' => $sop->id, 'user_id' => $userId],
                    [
                        'company_id' => $companyId,
                        'sent_by_user_id' => $sentBy->id,
                    ],
                );
            }

            return $sop->signoffs()->with(['user', 'sentBy'])->get();
        });
    }
}
