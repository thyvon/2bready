<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Industry\Models\Industry;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use Illuminate\Database\Seeder;

/**
 * Mines the exact taxonomy already built out in client-portal's
 * journey-data.ts (BADGE_LEVELS) — signed off by the project owner, not
 * invented here. Individual documents within a milestone aren't modeled as
 * backend rows yet (Document domain is still empty) — a milestone stays a
 * named unit, matching the frontend's own Milestone shape at this stage.
 */
class JourneyTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $industry = Industry::query()->where('code', 'F&B')->first();

        if (! $industry) {
            $this->command?->warn('Skipping JourneyTemplateSeeder — no F&B industry row found. Run IndustrySeeder first.');

            return;
        }

        $template = JourneyTemplate::query()->updateOrCreate(
            ['country_code' => 'KH', 'industry_id' => $industry->id],
            ['name' => 'Cambodia F&B Compliance Journey', 'is_active' => true],
        );

        $levels = [
            [
                'code' => 'L1',
                'name' => 'Bronze',
                'pathway_name' => 'The Launchpad',
                'pillar' => 'comply',
                'sort_order' => 1,
                'milestones' => ['Corporate & Legal', 'Tax Compliance', 'Labor & NSSF', 'ID & Site Assets'],
            ],
            [
                'code' => 'L2',
                'name' => 'Silver',
                'pathway_name' => 'Product Engineering',
                'pillar' => 'scale',
                'sort_order' => 2,
                'milestones' => ['Food Science', 'Regulatory & IP', 'Packaging & Value'],
            ],
            [
                'code' => 'L3',
                'name' => 'Gold',
                'pathway_name' => 'Operational Excellence',
                'pillar' => 'scale',
                'sort_order' => 3,
                'milestones' => ['SOP & Structure', 'Audit-Ready Finance'],
            ],
            [
                'code' => 'L4',
                'name' => 'Platinum',
                'pathway_name' => 'Global Readiness',
                'pillar' => 'lead',
                'sort_order' => 4,
                'milestones' => ['Investable Finance', 'Export Readiness'],
            ],
        ];

        foreach ($levels as $levelData) {
            $milestoneNames = $levelData['milestones'];
            unset($levelData['milestones']);

            $level = JourneyLevel::query()->updateOrCreate(
                ['journey_template_id' => $template->id, 'code' => $levelData['code']],
                $levelData,
            );

            foreach ($milestoneNames as $i => $name) {
                Milestone::query()->updateOrCreate(
                    ['journey_level_id' => $level->id, 'name' => $name],
                    ['sort_order' => $i + 1],
                );
            }
        }
    }
}
