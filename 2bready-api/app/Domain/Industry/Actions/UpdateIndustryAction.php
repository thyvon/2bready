<?php

declare(strict_types=1);

namespace App\Domain\Industry\Actions;

use App\Domain\Industry\Models\Industry;

class UpdateIndustryAction
{
    /** @param array<string, mixed> $data */
    public function execute(Industry $industry, array $data): Industry
    {
        $industry->update($data);

        return $industry;
    }
}
