<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Audit\Enums\AuditStatus;
use App\Domain\Audit\Models\Audit;
use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Models\MilestoneCompletion;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Package\Models\Package;
use App\Domain\Payment\Models\Subscription;
use App\Domain\SignOff\Models\SignoffDocument;
use App\Domain\SignOff\Models\SignoffDocumentUser;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FullWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. TP Partner ──────────────────────────────────────────────────
        $tpPartner = TpPartner::query()->firstOrCreate(
            ['name' => 'ADMIT Global Audit'],
            [
                'status' => 'active',
                'price_l2_cents' => 2500,
                'price_l3_cents' => 7500,
                'price_l4_cents' => 15000,
            ],
        );

        // TP auditor user linked to the partner
        $tpUser = User::where('email', 'auditor@2bready.com')->first();
        if ($tpUser) {
            \DB::table('auditors')->insertOrIgnore([
                'id' => \Illuminate\Support\Str::ulid(),
                'user_id' => $tpUser->id,
                'tp_partner_id' => $tpPartner->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ── 2. Company + owner (ensure linked) ─────────────────────────────
        $company = Company::query()->where('name', 'Test Company Ltd')->first();
        if (! $company) {
            $company = Company::query()->create([
                'id' => \Str::ulid(),
                'name' => 'Test Company Ltd',
                'slug' => 'test-company-ltd',
                'status' => 'active',
            ]);
        }

        $owner = User::where('email', 'owner@2bready.com')->first();
        if ($owner) {
            $owner->update(['current_company_id' => $company->id]);
            if (! $company->users()->where('user_id', $owner->id)->exists()) {
                $company->users()->attach($owner->id);
            }
        }

        // A staff member for signed-off document flow
        $staff = User::firstOrCreate(
            ['email' => 'staff@2bready.com'],
            [
                'name' => 'Staff Member',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'status' => 'active',
                'locale' => 'en',
            ],
        );
        $staff->assignRole('staff');
        if (! $company->users()->where('user_id', $staff->id)->exists()) {
            $company->users()->attach($staff->id);
        }

        // ── 3. Active subscription (L1 package) ────────────────────────────
        $l1Package = Package::query()
            ->where('journey_level_id', JourneyLevel::query()->where('code', 'L1')->first()?->id)
            ->where('billing_period', 'yearly')
            ->first();

        if ($l1Package) {
            Subscription::query()->firstOrCreate(
                [
                    'company_id' => $company->id,
                    'package_id' => $l1Package->id,
                ],
                [
                    'status' => 'active',
                    'started_at' => now()->subDays(30),
                    'expires_at' => now()->addDays(335),
                ],
            );
        }

        // ── 4. Milestone completions (L1 journey in progress) ──────────────
        $l1 = JourneyLevel::query()->where('code', 'L1')->first();
        if ($l1) {
            $milestones = Milestone::query()
                ->where('journey_level_id', $l1->id)
                ->orderBy('sort_order')
                ->get();

            // Complete first 2 of 3 milestones
            $completedCount = 0;
            foreach ($milestones as $milestone) {
                if ($completedCount >= 2) {
                    break;
                }
                MilestoneCompletion::query()->firstOrCreate(
                    [
                        'company_id' => $company->id,
                        'milestone_id' => $milestone->id,
                    ],
                    [
                        'completed_at' => now()->subDays(10 - $completedCount * 3),
                        'completed_by_user_id' => $owner?->id,
                        'trigger' => 'document_upload',
                    ],
                );
                $completedCount++;
            }
        }

        // ── 5. Documents (uploaded by company) ─────────────────────────────
        $templates = DocumentTemplate::query()
            ->whereHas('milestone.journeyLevel', fn ($q) => $q->where('code', 'L1'))
            ->whereNull('company_id')
            ->whereNull('parent_id')
            ->get()
            ->take(4);

        foreach ($templates as $template) {
            Document::query()->firstOrCreate(
                [
                    'company_id' => $company->id,
                    'document_template_id' => $template->id,
                ],
                [
                    'uploaded_by_user_id' => $owner?->id,
                    'file_path' => 'documents/'.\Str::random(20).'.pdf',
                    'original_filename' => $template->name.'.pdf',
                    'mime_type' => 'application/pdf',
                    'size_bytes' => fake()->numberBetween(50_000, 500_000),
                    'status' => 'verified',
                    'verified_by_user_id' => null,
                    'verified_at' => now()->subDays(2),
                ],
            );
        }

        // ── 6. TP Hire (company hired ADMIT for L2) ────────────────────────
        $hire = TpHire::query()->firstOrCreate(
            [
                'company_id' => $company->id,
                'tp_partner_id' => $tpPartner->id,
                'journey_level' => 'L2',
            ],
            [
                'price_agreed_cents' => 2500,
                'platform_commission_cents' => 375,
                'tp_payout_cents' => 2125,
                'status' => 'active',
                'payout_status' => 'unpaid',
            ],
        );

        // ── 7. Audit (hired → submitted → pending review) ──────────────────
        $audit = Audit::query()->firstOrCreate(
            [
                'company_id' => $company->id,
                'tp_hire_id' => $hire->id,
            ],
            [
                'journey_level' => 'L2',
                'status' => AuditStatus::Submitted,
                'score' => null,
                'feedback' => null,
                'assigned_at' => now()->subDays(5),
                'submitted_at' => now()->subHours(3),
            ],
        );

        // ── 8. Signed-off documents ────────────────────────────────────────
        $sd = SignoffDocument::query()->create([
            'company_id' => $company->id,
            'uploaded_by_user_id' => $owner?->id,
            'verified_by_user_id' => null,
            'title' => 'Sales SOP — Q3 2026',
            'original_filename' => 'sales-sop-q3.pdf',
            'file_path' => 'signoff/sales-sop-q3.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 120_000,
            'category' => 'sales',
            'status' => 'pending_review',
        ]);

        // Share with staff
        SignoffDocumentUser::query()->create([
            'signoff_document_id' => $sd->id,
            'company_id' => $company->id,
            'user_id' => $staff->id,
            'emailed_at' => now()->subDay(),
            'signed_at' => null,
        ]);

        // ── Summary ────────────────────────────────────────────────────────
        $this->command->info('✓ TP Partner: ADMIT Global Audit');
        $this->command->info('✓ Company: Test Company Ltd (active subscription L1)');
        $this->command->info('✓ Owner: owner@2bready.com / password');
        $this->command->info('✓ Staff: staff@2bready.com / password');
        $this->command->info('✓ TP Auditor: auditor@2bready.com / password');
        $this->command->info("✓ Milestones completed: $completedCount of ".$milestones->count().' (L1)');
        $this->command->info('✓ Documents uploaded: '.$templates->count());
        $this->command->info('✓ TP Hire: L2 with ADMIT (active)');
        $this->command->info('✓ Audit: L2 submitted, pending review');
        $this->command->info('✓ Signed-off doc: Sales SOP shared with staff');
    }
}
