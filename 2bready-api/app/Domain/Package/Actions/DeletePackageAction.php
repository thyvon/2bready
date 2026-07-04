<?php

declare(strict_types=1);

namespace App\Domain\Package\Actions;

use App\Domain\Package\Models\Package;

class DeletePackageAction
{
    public function execute(Package $package): void
    {
        $package->delete();
    }
}
