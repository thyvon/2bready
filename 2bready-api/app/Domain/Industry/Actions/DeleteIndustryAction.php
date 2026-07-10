<?php

declare(strict_types=1);

namespace App\Domain\Industry\Actions;

use App\Domain\Industry\Models\Industry;

class DeleteIndustryAction
{
    public function execute(Industry $industry): void
    {
        $industry->delete();
    }
}
