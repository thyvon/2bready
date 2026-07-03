<?php

declare(strict_types=1);

namespace App\Domain\Company\Services;

use App\Domain\Shared\Services\PlatformSettingService;

/**
 * v3 §0.2/§1.5: employee-count threshold bypasses the "Company Internal Rules"
 * document requirement. Threshold is admin-editable (platform_settings.bypass_employee_threshold,
 * seed 8) per v3 §0.5 — never a hardcoded number. This evaluator only sets the
 * flag on the company; MilestoneUnlockRuleEngine (Journey domain, Sprint 4) is
 * what actually reads bypass_flags to skip the milestone.
 */
class CompanyBypassEvaluator
{
    public function __construct(private readonly PlatformSettingService $settings) {}

    /** @return array<string, bool> */
    public function evaluate(?int $employeeCount): array
    {
        $threshold = (int) $this->settings->get('bypass_employee_threshold', 8);

        return [
            'company_internal_rules' => $employeeCount !== null && $employeeCount < $threshold,
        ];
    }
}
