<?php

declare(strict_types=1);

namespace App\Domain\Journey\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Payment\Models\Subscription;
use Illuminate\Support\Collection;

/**
 * Unlock logic: sequential-within-pillar, capped by what the company's
 * plan entitles them to (Week 2's "journey activation by plan" per the
 * proposal). Deliberately mirrors client-portal's activeLevelCodes()
 * (journey-data.ts) exactly — within the plan cap, a pillar's first level
 * unlocks on its own, and each subsequent level within the same pillar
 * unlocks only once every milestone of the previous level in that pillar
 * has a MilestoneCompletion for this company. Without an active (paid)
 * subscription the cap is zero, so nothing is unlocked at all. Levels in
 * different pillars don't gate each other (matches the existing, already
 * signed-off Comply/Scale/Lead grouping).
 */
class JourneyProgressService
{
    /** @return array<string> level codes (e.g. ['L1', 'L2']) unlocked for this company */
    public function unlockedLevelCodes(Company $company): array
    {
        // withoutGlobalScope('company') — by the time this runs, the caller
        // has already been authorized to see $company's journey (via
        // JourneyController's policy check or TpAssignmentController's
        // active-hire check); this is a pure read-only computation on an
        // already-authorized company, not a second authorization boundary.
        // Needed because a TP/auditor caller is never company-bypassed the
        // way admin/staff are — after BelongsToCompany's null-current_company_id
        // fix, a scoped query from that account would otherwise always match
        // nothing, silently reporting every level as locked regardless of
        // the company's real subscription/progress.
        /** @var Journey|null $journey */
        $journey = Journey::query()->withoutGlobalScope('company')->where('company_id', $company->id)->first();

        if (! $journey) {
            return [];
        }

        $levels = $journey->journeyTemplate->levels()->with('milestones.completions')->get();
        $completedMilestoneIds = $this->completedMilestoneIds($levels, $company);
        $capSortOrder = $this->subscriptionCapSortOrder($company);

        $unlocked = [];

        foreach ($levels->groupBy(fn (JourneyLevel $level) => $level->pillar->value) as $pillarLevels) {
            $previousFullyComplete = true;

            foreach ($pillarLevels as $level) {
                if (! $previousFullyComplete) {
                    break;
                }

                if ($level->sort_order <= $capSortOrder) {
                    $unlocked[] = $level->code;
                }

                // Milestone-completion chain keeps advancing regardless of the
                // plan cap — a company can complete milestones for a level
                // beyond their current plan (e.g. a document auto-verifies),
                // it just doesn't surface as unlocked until they upgrade.
                $milestoneIds = $level->milestones->pluck('id');
                $previousFullyComplete = $milestoneIds->isNotEmpty()
                    && $milestoneIds->every(fn (string $id) => $completedMilestoneIds->contains($id));
            }
        }

        return $unlocked;
    }

    /**
     * The highest level's sort_order this company is entitled to see as
     * unlocked, based on their currently active (paid) subscription's
     * package. `Company::activeSubscription` only ever points to a
     * Subscription once ConfirmPaymentAction has activated it, so a null
     * here genuinely means "hasn't checked out yet" rather than "pending."
     *
     * Every level is now a paid tier (L1 is the paid 'starter' tier, $19/mo
     * — see the seeder), so a company with no active subscription is not
     * entitled to anything: return 0 so not a single level surfaces as
     * unlocked until they check out.
     */
    private function subscriptionCapSortOrder(Company $company): int
    {
        // Not $company->activeSubscription — Subscription is also
        // BelongsToCompany-scoped, and that scope applies to relation
        // queries too, so the same TP-caller null-current_company_id issue
        // documented above would silently make this relation resolve to
        // null even when a real active subscription exists.
        $entitledLevel = $company->active_subscription_id
            ? Subscription::query()->withoutGlobalScope('company')->find($company->active_subscription_id)?->package?->journeyLevel
            : null;

        if ($entitledLevel) {
            return $entitledLevel->sort_order;
        }

        return 0;
    }

    /**
     * @param  Collection<int, JourneyLevel>  $levels
     * @return Collection<int, string>
     */
    private function completedMilestoneIds($levels, Company $company)
    {
        return $levels
            ->flatMap(fn (JourneyLevel $level) => $level->milestones)
            ->flatMap(fn ($milestone) => $milestone->completions)
            ->where('company_id', $company->id)
            ->pluck('milestone_id');
    }
}
