<?php

declare(strict_types=1);

namespace App\Domain\Journey\Services\Rules;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Contracts\MilestoneUnlockRule;
use App\Domain\Journey\Models\Milestone;

/**
 * Employee-count bypass rule (v3 §0.2/§1.5): the "Company Internal Rules"
 * document requirement is waived for micro-companies. The threshold itself is
 * admin-editable (platform_settings.bypass_employee_threshold, seed 8) and is
 * applied when the company is created/updated by CompanyBypassEvaluator —
 * this rule only consumes the resulting `bypass_flags` on the company; it
 * never recomputes the threshold itself.
 *
 * Evaluated BEFORE the standard unlock rules: a milestone whose every
 * required document is waived never appears as "required" to begin with.
 */
class EmployeeCountBypassRule implements MilestoneUnlockRule
{
    public function satisfied(Milestone $milestone, Company $company): bool
    {
        $requiredTemplates = $milestone->documentTemplates
            ->where('is_required', true)
            ->filter(fn (DocumentTemplate $template) => $this->templateAppliesToCompany($template, $company));

        if ($requiredTemplates->isEmpty()) {
            return false;
        }

        return $requiredTemplates->every(
            fn (DocumentTemplate $template) => $this->isTemplateBypassed($template, $company),
        );
    }

    private function templateAppliesToCompany(DocumentTemplate $template, Company $company): bool
    {
        return $template->company_id === null || $template->company_id === $company->id;
    }

    private function isTemplateBypassed(DocumentTemplate $template, Company $company): bool
    {
        return $template->bypass_key !== null
            && ($company->bypass_flags[$template->bypass_key] ?? false) === true;
    }
}
