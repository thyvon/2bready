<?php

declare(strict_types=1);

namespace App\Domain\Journey\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Package\Enums\Tier;
use App\Domain\Package\Models\Package;
use Illuminate\Support\Collection;

/**
 * Unlock logic: sequential-within-pillar, capped by what the company's
 * plan entitles them to (Week 2's "journey activation by plan" per the
 * proposal). Deliberately mirrors client-portal's activeLevelCodes()
 * (journey-data.ts) exactly — a pillar's first level is always unlocked
 * (subject to the plan cap below), and each subsequent level within the
 * same pillar unlocks only once every milestone of the previous level in
 * that pillar has a MilestoneCompletion for this company. Levels in
 * different pillars don't gate each other (matches the existing, already
 * signed-off Comply/Scale/Lead grouping).
 */
class JourneyProgressService
{
    /** @return array<string> level codes (e.g. ['L1', 'L2']) unlocked for this company */
    public function unlockedLevelCodes(Company $company): array
    {
        /** @var Journey|null $journey */
        $journey = Journey::query()->where('company_id', $company->id)->first();

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
     * With no active subscription, default to this company's industry's
     * Free-tier package (Tier::Free costs $0, so nothing should require an
     * explicit checkout to see it) rather than locking everything out. If
     * that industry has no packages configured at all yet, don't gate
     * (fail open) instead of blocking every company in it.
     */
    private function subscriptionCapSortOrder(Company $company): int
    {
        $entitledLevel = $company->activeSubscription?->package?->journeyLevel;

        if ($entitledLevel) {
            return $entitledLevel->sort_order;
        }

        $freeLevel = Package::query()
            ->where('industry_id', $company->industry_id)
            ->where('tier', Tier::Free)
            ->with('journeyLevel')
            ->first()
            ?->journeyLevel;

        if ($freeLevel) {
            return $freeLevel->sort_order;
        }

        return PHP_INT_MAX;
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
