<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopCompany;
use App\Domain\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Creates a new adoption record or updates an existing one with new overrides.
 */
class UpsertSopAdoptionAction
{
    public function execute(
        Sop $globalSop,
        string $companyId,
        User $adoptedBy,
        ?string $overrideContentEn = null,
        ?string $overrideContentKh = null,
    ): SopCompany {
        if ($globalSop->company_id !== null) {
            throw new \InvalidArgumentException('Only global SOPs (company_id = null) can be adopted.');
        }

        return DB::transaction(function () use ($globalSop, $companyId, $adoptedBy, $overrideContentEn, $overrideContentKh) {
            return SopCompany::updateOrCreate(
                ['sop_id' => $globalSop->id, 'company_id' => $companyId],
                [
                    'override_content_en' => $overrideContentEn,
                    'override_content_kh' => $overrideContentKh,
                    'adopted_at' => now(),
                    'adopted_by_user_id' => $adoptedBy->id,
                ],
            );
        });
    }
}
