<?php

declare(strict_types=1);

namespace App\Domain\Sop\Actions;

use App\Domain\Sop\Models\SopCompany;

/**
 * Removes a company's adoption of a global SOP.
 */
class UnadoptSopAction
{
    public function execute(SopCompany $adoption): void
    {
        $adoption->delete();
    }
}
