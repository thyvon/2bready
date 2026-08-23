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
                'description' => 'Audit-ready under Cambodian law — GDT, MoC, MLVT and NSSF compliance handled precisely, with risk mitigated and regulatory alignment completed.',
                'pillar' => 'comply',
                'sort_order' => 1,
                'milestones' => [
                    'Corporate & Legal' => 'Your company\'s legal foundation: registration, incorporation papers and industry classification verified against MoC records.',
                    'Tax Compliance' => 'Proof that your tax obligations are current — patent tax, VAT and e-filing receipts checked against GDT records.',
                    'Labor & NSSF' => 'Employer-side compliance: MLVT declarations, NSSF enrollment and internal labor rules as required by Cambodian labor law.',
                    'ID & Site Assets' => 'Identity and premises verification — shareholders, physical business location and official company assets.',
                ],
            ],
            [
                'code' => 'L2',
                'name' => 'Silver',
                'pathway_name' => 'Product Engineering',
                'pillar' => 'scale',
                'description' => 'Certified quality and safety standards — lab-verified products, protected IP and packaging that builds consumer trust.',
                'sort_order' => 2,
                'milestones' => [
                    'Food Science' => 'Scientific proof of product safety: accredited lab results, nutrition labeling and shelf-life evidence.',
                    'Regulatory & IP' => 'Product registrations, hygiene certificates and trademark protection — your right to sell, secured.',
                    'Packaging & Value' => 'Retail-ready labels meeting labeling law, plus cost analysis that proves your unit economics.',
                ],
            ],
            [
                'code' => 'L3',
                'name' => 'Gold',
                'pathway_name' => 'Operational Excellence',
                'pillar' => 'scale',
                'description' => 'Internal governance and financial clarity — standardized SOPs and CAS-aligned books that unlock B2B operational scaling.',
                'sort_order' => 3,
                'milestones' => [
                    'SOP & Structure' => 'Documented organizational structure and standard operating procedures — how your business actually runs, on paper.',
                    'Audit-Ready Finance' => 'CAS-standard accounting with complete statements and reconciliations, ready for any external audit.',
                ],
            ],
            [
                'code' => 'L4',
                'name' => 'Platinum',
                'pathway_name' => 'Global Readiness',
                'pillar' => 'lead',
                'description' => 'Investable and export-ready — institutional-grade finance, international certifications and market-entry strategy beyond Cambodia.',
                'sort_order' => 4,
                'milestones' => [
                    'Investable Finance' => 'Credit history, independent audits and valuations that let banks and investors price your business with confidence.',
                    'Export Readiness' => 'International certifications, Incoterms strategy and market analysis proving you can sell across borders.',
                ],
            ],
        ];

        foreach ($levels as $levelData) {
            $milestoneNames = $levelData['milestones'];
            unset($levelData['milestones']);

            $level = JourneyLevel::query()->updateOrCreate(
                ['journey_template_id' => $template->id, 'code' => $levelData['code']],
                $levelData,
            );

            $sortOrder = 0;
            foreach ($milestoneNames as $name => $description) {
                $sortOrder++;

                Milestone::query()->updateOrCreate(
                    ['journey_level_id' => $level->id, 'name' => $name],
                    ['sort_order' => $sortOrder, 'description' => $description],
                );
            }
        }
    }
}
