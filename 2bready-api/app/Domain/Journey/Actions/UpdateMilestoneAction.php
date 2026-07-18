<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\Models\Milestone;

class UpdateMilestoneAction
{
    /** @param array<string, mixed> $data */
    public function execute(Milestone $milestone, array $data): Milestone
    {
        $milestone->update($data);

        return $milestone;
    }
}
