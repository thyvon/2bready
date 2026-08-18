<?php

declare(strict_types=1);

namespace App\Domain\Journey\Services\Rules;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Contracts\MilestoneUnlockRule;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Models\MilestoneCompletion;

/**
 * The standard rule: a milestone is satisfied when the company has a
 * MilestoneCompletion record for it. This is the source of truth for journey
 * progress (SKILL.md) — the engine reads this table, not milestones directly.
 */
class MilestoneCompletionRule implements MilestoneUnlockRule
{
    public function satisfied(Milestone $milestone, Company $company): bool
    {
        return MilestoneCompletion::query()
            ->withoutGlobalScope('company')
            ->where('company_id', $company->id)
            ->where('milestone_id', $milestone->id)
            ->exists();
    }
}
