<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Journey\Models\Milestone;

class DeleteMilestoneAction
{
    public function execute(Milestone $milestone): void
    {
        $milestone->delete();
    }
}
