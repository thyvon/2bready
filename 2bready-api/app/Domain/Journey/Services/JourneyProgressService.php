<?php

declare(strict_types=1);

namespace App\Domain\Journey\Services;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use Illuminate\Support\Collection;

/**
 * Week-1 unlock logic: simple sequential-within-pillar, no pluggable
 * strategies or bypass rules yet (that's the automated MilestoneUnlockRuleEngine,
 * Week 2 per the proposal's own de-risking plan for Sprint 4). Deliberately
 * mirrors client-portal's activeLevelCodes() (journey-data.ts) exactly — a
 * pillar's first level is always unlocked, and each subsequent level within
 * the same pillar unlocks only once every milestone of the previous level in
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

        $unlocked = [];

        foreach ($levels->groupBy(fn (JourneyLevel $level) => $level->pillar->value) as $pillarLevels) {
            $previousFullyComplete = true;

            foreach ($pillarLevels as $level) {
                if (! $previousFullyComplete) {
                    break;
                }

                $unlocked[] = $level->code;

                $milestoneIds = $level->milestones->pluck('id');
                $previousFullyComplete = $milestoneIds->isNotEmpty()
                    && $milestoneIds->every(fn (string $id) => $completedMilestoneIds->contains($id));
            }
        }

        return $unlocked;
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
