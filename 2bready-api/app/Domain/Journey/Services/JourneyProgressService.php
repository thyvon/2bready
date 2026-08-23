<?php

declare(strict_types=1);

namespace App\Domain\Journey\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Domain\Payment\Models\Subscription;

/**
 * Unlock logic: sequential-within-pillar, capped by what the company's
 * plan entitles them to (Week 2's "journey activation by plan" per the
 * proposal). Deliberately mirrors client-portal's activeLevelCodes()
 * (journey-data.ts) exactly — within the plan cap, a pillar's first level
 * unlocks on its own, and each subsequent level within the same pillar
 * unlocks only once every milestone of the previous level in that pillar
 * is satisfied for this company. Without an active (paid) subscription the
 * cap is zero, so nothing is unlocked at all. Levels in different pillars
 * don't gate each other (matches the existing, already signed-off
 * Comply/Scale/Lead grouping).
 *
 * What "satisfied" means per milestone is decided by MilestoneUnlockRuleEngine
 * (bypass rules first, then MilestoneCompletion), not by reading the
 * completions relation directly here — v2's "the engine reads
 * MilestoneCompletion records, not milestones directly."
 */
class JourneyProgressService
{
    public function __construct(private readonly MilestoneUnlockRuleEngine $unlockRuleEngine) {}

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

        // documentTemplates eager-loaded so the bypass rules don't N+1 on
        // the relation while scanning the chain.
        $levels = $journey->journeyTemplate->levels()->with('milestones.documentTemplates')->get();
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
                $previousFullyComplete = $level->milestones->isNotEmpty()
                    && $level->milestones->every(
                        fn (Milestone $milestone) => $this->unlockRuleEngine->isMilestoneSatisfied($milestone, $company),
                    );
            }
        }

        return $unlocked;
    }

    /**
     * The highest level's sort_order this company is entitled to see as
     * unlocked, taken across ALL of their active subscriptions — levels are
     * priced independently (à la carte), so entitlements accumulate: a
     * company holding L3 + L4 keeps L4 even after later activating L1.
     *
     * (This used to follow Company::active_subscription_id — the last
     * confirmed payment only. Activating a lower level then DEMOTED the cap
     * and locked previously-paid higher levels, e.g. production's
     * Demo Bakery Co. holding L4 while capped at L3.)
     *
     * Every level is a paid tier, so no active subscription → 0: nothing
     * unlocks until they check out.
     */
    private function subscriptionCapSortOrder(Company $company): int
    {
        // withoutGlobalScope('company') — Subscription is also
        // BelongsToCompany-scoped, and that scope applies to relation
        // queries too, so a TP-caller's null-current_company_id would
        // otherwise silently match nothing regardless of real subscriptions.
        return (int) Subscription::query()
            ->withoutGlobalScope('company')
            ->where('subscriptions.company_id', $company->id)
            ->where('subscriptions.status', SubscriptionStatus::Active)
            ->join('packages', 'packages.id', '=', 'subscriptions.package_id')
            ->join('journey_levels', 'journey_levels.id', '=', 'packages.journey_level_id')
            ->max('journey_levels.sort_order');
    }
}
