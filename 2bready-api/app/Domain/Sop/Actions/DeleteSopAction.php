<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\Models\Sop;
use Illuminate\Support\Facades\DB;

/**
 * Deletes an SOP (soft delete).
 *
 * Also removes any company adoptions of this SOP.
 */
class DeleteSopAction
{
    public function execute(Sop $sop): void
    {
        DB::transaction(function () use ($sop) {
            // Soft delete removes adoptions via cascade
            $sop->delete();
        });
    }
}
