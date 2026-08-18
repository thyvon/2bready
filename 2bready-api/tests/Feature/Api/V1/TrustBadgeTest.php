<?php

declare(strict_types=1);

use App\Domain\Audit\Events\AuditDecisionMade;
use App\Domain\Audit\Models\Audit;
use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\TrustBadge\Jobs\GenerateCertificateJob;
use App\Domain\TrustBadge\Models\TrustBadge;
use App\Domain\User\Models\User;
use Database\Seeders\PlatformSettingSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([RolePermissionSeeder::class, PlatformSettingSeeder::class]);
    Storage::fake('local');
});

/** A company + an approved audit wired to a real journey template + level. */
function badgeFixture(): array
{
    $company = Company::factory()->create(['name' => 'Kravan Foods Co', 'name_kh' => 'ក្រាវ៉ាន់ហ្វូដ']);

    $template = JourneyTemplate::factory()->create();
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L3']);
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    $docTemplate = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
    Document::factory()->verified()->create([
        'company_id' => $company->id,
        'document_template_id' => $docTemplate->id,
    ]);
    Journey::factory()->create(['company_id' => $company->id, 'journey_template_id' => $template->id]);

    $tpPartner = TpPartner::factory()->create();
    $auditor = User::factory()->withTpPartner($tpPartner)->create();
    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'journey_level' => 'L3',
    ]);

    $audit = Audit::create([
        'company_id' => $company->id,
        'tp_hire_id' => $hire->id,
        'journey_level' => 'L3',
        'status' => 'approved',
        'score' => 100,
        'reviewed_at' => now(),
    ]);

    return compact('company', 'level', 'audit');
}

// ─── IssueTrustBadgeAction + listener wiring ─────────────────────────────────

it('issues a trust badge for an approved audit with the level resolved', function () {
    ['company' => $company, 'level' => $level, 'audit' => $audit] = badgeFixture();
    $admin = User::factory()->admin()->create();

    event(new AuditDecisionMade($audit, $admin));

    $badge = TrustBadge::query()->withoutGlobalScope('company')->where('audit_id', $audit->id)->first();

    expect($badge)->not->toBeNull()
        ->and($badge->company_id)->toBe($company->id)
        ->and($badge->journey_level_id)->toBe($level->id)
        ->and($badge->level)->toBe('L3')
        ->and($badge->issued_by)->toBe($admin->id)
        ->and($badge->issued_at)->not->toBeNull();
});

it('does not issue a badge for a rejected audit', function () {
    ['audit' => $audit] = badgeFixture();
    $admin = User::factory()->admin()->create();
    $audit->update(['status' => 'rejected']);

    event(new AuditDecisionMade($audit, $admin));

    expect(TrustBadge::query()->withoutGlobalScope('company')->count())->toBe(0);
});

it('dispatches GenerateCertificateJob when a badge is issued', function () {
    Queue::fake();
    ['audit' => $audit] = badgeFixture();
    $admin = User::factory()->admin()->create();

    event(new AuditDecisionMade($audit, $admin));

    Queue::assertPushed(GenerateCertificateJob::class);
});

it('approving an audit via the review endpoint issues the badge end-to-end', function () {
    $admin = User::factory()->admin()->create();
    ['audit' => $audit] = badgeFixture();
    $audit->update(['status' => 'submitted']);

    $this->actingAs($admin)->postJson("/api/v1/audits/{$audit->id}/review", ['decision' => 'approved'])
        ->assertOk()->assertJsonPath('data.status', 'approved');

    expect(TrustBadge::query()->withoutGlobalScope('company')->where('audit_id', $audit->id)->exists())->toBeTrue();
});

// ─── List endpoint (company + admin) ─────────────────────────────────────────

it('lists only the current company own badges for a company user', function () {
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();
    // This company owns the badge.
    $other = Company::factory()->create();
    $otherOwner = User::factory()->companyOwner()->withCompany($other)->create();

    ['level' => $level, 'audit' => $audit1] = badgeFixture();
    TrustBadge::query()->withoutGlobalScope('company')->create([
        'company_id' => $other->id,
        'journey_level_id' => $level->id,
        'audit_id' => $audit1->id,
        'level' => 'L3',
        'issued_at' => now(),
    ]);

    $this->actingAs($owner)->getJson('/api/v1/trust-badges')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->actingAs($otherOwner)->getJson('/api/v1/trust-badges')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('lets an admin list all badges cross-tenant', function () {
    $admin = User::factory()->admin()->create();
    ['level' => $level, 'audit' => $audit] = badgeFixture();
    TrustBadge::query()->withoutGlobalScope('company')->create([
        'company_id' => $audit->company_id,
        'journey_level_id' => $level->id,
        'audit_id' => $audit->id,
        'level' => 'L3',
        'issued_at' => now(),
    ]);

    $this->actingAs($admin)->getJson('/api/v1/trust-badges')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.level', 'L3');
});

it('requires the trust_badge.view permission', function () {
    $staff = User::factory()->withRole('staff')->create();

    $this->actingAs($staff)->getJson('/api/v1/trust-badges')
        ->assertOk();
});

it('rejects unauthenticated badge listing', function () {
    $this->getJson('/api/v1/trust-badges')->assertUnauthorized();
});
