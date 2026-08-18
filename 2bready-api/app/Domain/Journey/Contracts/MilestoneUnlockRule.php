<?php

declare(strict_types=1);

namespace App\Domain\Journey\Contracts;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Models\Milestone;

/**
 * Strategy contract for the MilestoneUnlockRuleEngine (v3 §1.5, v2 §3.1):
 * each rule independently answers "does this milestone count as satisfied for
 * this company?" Bypass rules are evaluated BEFORE the standard rules so a
 * bypassed milestone never appears as required to begin with.
 */
interface MilestoneUnlockRule
{
    /** True when this rule alone marks the milestone satisfied for the company. */
    public function satisfied(Milestone $milestone, Company $company): bool;
}
