<?php

declare(strict_types=1);

namespace App\Domain\Journey\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Enums\MilestoneCompletionTrigger;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Models\MilestoneCompletion;
use App\Domain\User\Models\User;

/**
 * The Week-1 "simplified admin-signoff unlock" path (per the proposal's own
 * de-risking plan for Sprint 4) — an admin/staff user directly records a
 * completion. The automated triggers (document_upload, audit_approval) are
 * Week 2, wired from their own domain events once Document/Audit exist.
 */
class CompleteMilestoneAction
{
    public function execute(
        Company $company,
        Milestone $milestone,
        ?User $completedBy,
        MilestoneCompletionTrigger $trigger = MilestoneCompletionTrigger::AdminSignoff,
    ): MilestoneCompletion {
        $existing = MilestoneCompletion::query()
            ->where('company_id', $company->id)
            ->where('milestone_id', $milestone->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        return MilestoneCompletion::create([
            'company_id' => $company->id,
            'milestone_id' => $milestone->id,
            'completed_at' => now(),
            'completed_by_user_id' => $completedBy?->id,
            'trigger' => $trigger,
        ]);
    }
}
