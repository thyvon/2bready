<?php

declare(strict_types=1);

namespace App\Domain\Journey\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Contracts\MilestoneUnlockRule;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Services\Rules\EmployeeCountBypassRule;
use App\Domain\Journey\Services\Rules\MilestoneCompletionRule;

/**
 * Strategy-based unlock evaluation (v3 §1.5, v2 §3.1 strategy pattern):
 * answers "is this milestone satisfied for this company?" Bypass rules are
 * evaluated BEFORE the standard rules, so a bypassed milestone never appears
 * as required to begin with. Future rules (e.g. auto-verification against a
 * government API) implement MilestoneUnlockRule and are added to the engine.
 */
class MilestoneUnlockRuleEngine
{
    /** @var list<MilestoneUnlockRule> bypass rules, evaluated first */
    private array $bypassRules;

    public function __construct(
        private readonly MilestoneCompletionRule $completionRule,
        private readonly EmployeeCountBypassRule $bypassRule,
    ) {
        $this->bypassRules = [$bypassRule];
    }

    public function isMilestoneSatisfied(Milestone $milestone, Company $company): bool
    {
        foreach ($this->bypassRules as $rule) {
            if ($rule->satisfied($milestone, $company)) {
                return true;
            }
        }

        return $this->completionRule->satisfied($milestone, $company);
    }
}
