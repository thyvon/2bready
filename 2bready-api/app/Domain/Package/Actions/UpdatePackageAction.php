<?php

declare(strict_types=1);

namespace App\Domain\Package\Actions;

use App\Domain\Package\Models\Package;

class UpdatePackageAction
{
    /** @param array<string, mixed> $data */
    public function execute(Package $package, array $data): Package
    {
        $package->update($data);

        return $package;
    }
}
