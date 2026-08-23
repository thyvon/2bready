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

    /**
     * Documents that a qualifying company may waive (v3 §0.2/§1.5). Key =
     * document name, value = the bypass key the company's `bypass_flags`
     * JSONB carries (set by CompanyBypassEvaluator). EmployeeCountBypassRule
     * matches this key against those flags to skip the milestone.
     *
     * @var array<int, string>
     */
    private const BYPASS_KEYS = [
        'Company Internal Rules' => 'company_internal_rules',
    ];

    /**
     * SAMPLE short descriptions shown as tooltips on the landing pricing
     * cards (public /pricing) — one day authored by the team via the admin
     * journey-template builder; the seeder just guarantees non-empty copy.
     *
     * @var array<int, string>
     */
    private const DESCRIPTIONS = [
        'MoC Registration' => 'Official company registration with the Ministry of Commerce.',
        'Articles of Incorporation' => 'Your company charter defining ownership, purpose and structure.',
        'ISIC Code Selection Analysis' => 'The industry classification code that determines your tax and licensing rules.',
        'Business Name Reservation Certificate' => 'Proof your registered business name is reserved with MoC.',
        'Annual Patent Tax' => 'The yearly patent (business) tax filing every registered company owes the GDT.',
        'Value Added Tax (VAT) Certificate' => 'Your VAT registration certificate for taxable sales.',
        'Bank Account E-Filing Receipt' => 'Evidence of tax payments filed through your linked bank e-filing account.',
        'Enterprise Opening Declaration (MLVT)' => 'The employer declaration filed with MLVT when you open operations.',
        'NSSF Membership Card' => 'Proof your employees are enrolled in the National Social Security Fund.',
        'Company Internal Rules' => 'Mandatory internal labor rules filed with the labor authorities.',
        'Shareholder ID / Passport' => 'Identity documents for every shareholder of record.',
        'Lease Agreement or Land Title' => 'Proof of your physical business premises.',
        'Company Stamp Image & Digital Signature' => 'The official company stamp and authorized digital signature.',
        'Lab Report (Lab CoA)' => 'Accredited laboratory certificate of analysis for your product.',
        'Nutrition Facts Table' => 'The compliant nutrition label for your product packaging.',
        'Shelf-life Test Report' => 'Laboratory evidence of your product\'s verified shelf life.',
        'Product Registration Certificate' => 'Product registration with the responsible Cambodian authority.',
        'Hygiene Standard Certificate (GHP/GMP/HACCP)' => 'Food-safety certification covering hygiene and process standards.',
        'Trademark Registration Certificate' => 'Proof your brand is trademark-protected in Cambodia.',
        'GS1 Membership and GTIN Tracker Table' => 'GS1 barcoding membership and your product barcode register.',
        'Final Label Artwork File' => 'The print-ready product label meeting Cambodian labeling law.',
        'Cost of Goods Sold (COGS) Analysis' => 'A documented breakdown of your per-unit production costs.',
        'Organizational Chart' => 'A current chart of roles and reporting lines.',
        'Job Descriptions' => 'Written job descriptions for every role in the chart.',
        'SOP Master Inventory' => 'A master list of every SOP your company maintains.',
        'Core SOP Documents (Production & Warehouse)' => 'The operating procedures for production and warehouse work.',
        'CAS Standard Accounting Chart' => 'Your accounting system mapped to the Cambodian Accounting Standard chart.',
        'Balance Sheet' => 'A current balance sheet prepared to CAS standards.',
        'Income Statement / P&L' => 'Your profit-and-loss statement for the current period.',
        'Cash Flow Statement' => 'A statement tracking operating, investing and financing cash flows.',
        'Bank Reconciliation Report' => 'Reconciliations proving your books match your bank accounts.',
        'Tax Return E-Filing Records' => 'Records of tax returns actually filed through GDT e-filing.',
        'CBC Credit Reports' => 'Credit bureau reports showing your company\'s borrowing history.',
        'Independent Audited Financial Reports' => 'Financial statements audited by an independent licensed firm.',
        'Financial Projections & Business Valuation' => 'Forward-looking projections and a defensible business valuation.',
        'Market Gap Analysis Report' => 'Analysis identifying the export market gap your product fills.',
        'International Standard Certificates (ISO, BRC, Halal)' => 'Internationally recognized certifications required by export buyers.',
        'International Logistics Strategy (Incoterms)' => 'Your documented Incoterms-based export logistics plan.',
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
                        'description' => self::DESCRIPTIONS[$name] ?? null,
                        'is_required' => true,
                        'bypass_key' => self::BYPASS_KEYS[$name] ?? null,
                        'recurrence_type' => self::RECURRENCE[$name] ?? 'one_time',
                        'expiry_months' => self::EXPIRY_MONTHS[$name] ?? null,
                        'sort_order' => $i + 1,
                    ],
                );
            }
        }
    }
}
