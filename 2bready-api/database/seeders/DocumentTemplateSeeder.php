<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\JourneyLevel;
use Illuminate\Database\Seeder;

/**
 * Mines the exact document names already in client-portal's journey-data.ts
 * (BADGE_LEVELS[].milestones[].docs and EXPIRY_MONTHS) — signed off by the
 * project owner, not invented here. Requires JourneyTemplateSeeder to have
 * already run (milestones must exist).
 */
class DocumentTemplateSeeder extends Seeder
{
    /**
     * Rolling-validity windows, in months — used ONLY by recurrence_type
     * 'rolling', where any upload newer than this is acceptable. Periodic
     * (monthly/annual) docs ignore this; their interval comes from the type.
     *
     * @var array<int, int>
     */
    private const EXPIRY_MONTHS = [
        'Lab Report (Lab CoA)' => 6,
        'CBC Credit Reports' => 6,
    ];

    /**
     * How each recurring document recurs. Anything not listed is one-time.
     * Real annual filings/certificates are periodic_annual (a specific
     * year's filing is a slot that's either filled or missing, so a gap is
     * visible); a lab result's validity window is rolling — it doesn't reset
     * on the calendar.
     *
     * @var array<int, string>
     */
    private const RECURRENCE = [
        'Annual Patent Tax' => 'periodic_annual',
        'Hygiene Standard Certificate (GHP/GMP/HACCP)' => 'periodic_annual',
        'International Standard Certificates (ISO, BRC, Halal)' => 'periodic_annual',
        'Independent Audited Financial Reports' => 'periodic_annual',
        'Lab Report (Lab CoA)' => 'rolling',
        'CBC Credit Reports' => 'rolling',
    ];

    public function run(): void
    {
        $docsByMilestone = [
            'Corporate & Legal' => [
                'MoC Registration',
                'Articles of Incorporation',
                'ISIC Code Selection Analysis',
                'Business Name Reservation Certificate',
            ],
            'Tax Compliance' => [
                'Annual Patent Tax',
                'Value Added Tax (VAT) Certificate',
                'Bank Account E-Filing Receipt',
            ],
            'Labor & NSSF' => [
                'Enterprise Opening Declaration (MLVT)',
                'NSSF Membership Card',
                'Company Internal Rules',
            ],
            'ID & Site Assets' => [
                'Shareholder ID / Passport',
                'Lease Agreement or Land Title',
                'Company Stamp Image & Digital Signature',
            ],
            'Food Science' => [
                'Lab Report (Lab CoA)',
                'Nutrition Facts Table',
                'Shelf-life Test Report',
            ],
            'Regulatory & IP' => [
                'Product Registration Certificate',
                'Hygiene Standard Certificate (GHP/GMP/HACCP)',
                'Trademark Registration Certificate',
                'GS1 Membership and GTIN Tracker Table',
            ],
            'Packaging & Value' => [
                'Final Label Artwork File',
                'Cost of Goods Sold (COGS) Analysis',
            ],
            'SOP & Structure' => [
                'Organizational Chart',
                'Job Descriptions',
                'SOP Master Inventory',
                'Core SOP Documents (Production & Warehouse)',
            ],
            'Audit-Ready Finance' => [
                'CAS Standard Accounting Chart',
                'Balance Sheet',
                'Income Statement / P&L',
                'Cash Flow Statement',
                'Bank Reconciliation Report',
                'Tax Return E-Filing Records',
            ],
            'Investable Finance' => [
                'CBC Credit Reports',
                'Independent Audited Financial Reports',
                'Financial Projections & Business Valuation',
            ],
            'Export Readiness' => [
                'Market Gap Analysis Report',
                'International Standard Certificates (ISO, BRC, Halal)',
                'International Logistics Strategy (Incoterms)',
            ],
        ];

        $milestones = JourneyLevel::query()->with('milestones')->get()->flatMap(fn (JourneyLevel $level) => $level->milestones);

        foreach ($milestones as $milestone) {
            $docs = $docsByMilestone[$milestone->name] ?? null;

            if (! $docs) {
                continue;
            }

            foreach ($docs as $i => $name) {
                DocumentTemplate::query()->updateOrCreate(
                    ['milestone_id' => $milestone->id, 'name' => $name],
                    [
                        'is_required' => true,
                        'recurrence_type' => self::RECURRENCE[$name] ?? 'one_time',
                        'expiry_months' => self::EXPIRY_MONTHS[$name] ?? null,
                        'sort_order' => $i + 1,
                    ],
                );
            }
        }
    }
}
