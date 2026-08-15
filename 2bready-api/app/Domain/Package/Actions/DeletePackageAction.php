<?php

declare(strict_types=1);

namespace App\Domain\Package\Actions;

use App\Domain\Package\Models\Package;

/**
 * Archives a journey-level package group — the representative row and its
 * sibling billing-period row (found by journey_level_id) together, so the
 * admin portal's "one package" delete removes both monthly and yearly rows
 * instead of leaving an orphaned half.
 */
class DeletePackageAction
{
    public function execute(Package $package): void
    {
        if ($package->journey_level_id !== null) {
            Package::query()
                ->where('journey_level_id', $package->journey_level_id)
                ->where('industry_id', $package->industry_id)
                ->where('id', '!=', $package->id)
                ->delete();
        }

        $package->delete();
    }
}