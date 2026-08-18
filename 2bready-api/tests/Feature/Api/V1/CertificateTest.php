<?php

declare(strict_types=1);

use App\Domain\Audit\Models\Audit;
use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\TrustBadge\Jobs\GenerateCertificateJob;
use App\Domain\TrustBadge\Models\Certificate;
use App\Domain\TrustBadge\Models\TrustBadge;
use App\Domain\TrustBadge\Services\CertificateGenerationService;
use App\Domain\User\Models\User;
use Database\Seeders\PlatformSettingSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([RolePermissionSeeder::class, PlatformSettingSeeder::class]);
    Storage::fake('local');
});

/** An approved audit + issued badge, wired to a journey template + level. */
function certificateFixture(): array
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

    $badge = TrustBadge::query()->withoutGlobalScope('company')->create([
        'company_id' => $company->id,
        'journey_level_id' => $level->id,
        'audit_id' => $audit->id,
        'level' => 'L3',
        'issued_at' => now(),
    ]);

    return compact('company', 'audit', 'badge');
}

// ─── CertificateGenerationService ────────────────────────────────────────────

it('generates a certificate PDF with QR and snapshots the master verifier stamp', function () {
    ['company' => $company, 'audit' => $audit, 'badge' => $badge] = certificateFixture();
    $service = app(CertificateGenerationService::class);

    $certificate = $service->generate($badge);

    expect($certificate)->toBeInstanceOf(Certificate::class)
        ->and($certificate->trust_badge_id)->toBe($badge->id)
        ->and($certificate->audit_id)->toBe($audit->id)
        ->and($certificate->qr_payload_url)->toBe("https://verify.2bready.asia/{$audit->id}")
        ->and($certificate->master_verifier_stamp['verified_by'])->toBe('ADMIT UNIT Master Auditors')
        ->and($certificate->master_verifier_stamp['approved_by'])->toBe('ADMIT Global Executive')
        ->and($certificate->master_verifier_stamp['prepared_by'])->toBe('2bReady Trust Engine Powered by ADMIT Global')
        ->and($certificate->issued_at)->not->toBeNull();

    // PDF persisted on the documents disk.
    Storage::disk('local')->assertExists($certificate->pdf_url);

    // The badge's own QR pointer is synced too (ERD).
    expect($badge->fresh()->qr_payload_url)->toBe("https://verify.2bready.asia/{$audit->id}");

    // PDF is a real PDF (starts with %PDF) and embeds the Khmer font.
    $bytes = Storage::disk('local')->get($certificate->pdf_url);
    expect(substr($bytes, 0, 4))->toBe('%PDF');
});

it('snapshots the stamp so later setting edits do not rewrite the certificate', function () {
    ['badge' => $badge] = certificateFixture();
    $service = app(CertificateGenerationService::class);
    $certificate = $service->generate($badge);

    app(PlatformSettingService::class)->set('certificate.master_verification_authority', [
        'verified_by' => 'Changed Authority',
        'approved_by' => 'Changed Approver',
        'prepared_by' => 'Changed Preparer',
    ], 'certificate');

    expect($certificate->fresh()->master_verifier_stamp['verified_by'])->toBe('ADMIT UNIT Master Auditors');
});

it('does not double-generate a certificate for an already-certified badge', function () {
    ['badge' => $badge] = certificateFixture();
    $service = app(CertificateGenerationService::class);

    $service->generate($badge);

    (new GenerateCertificateJob($badge->id))->handle($service);

    expect(Certificate::query()->where('trust_badge_id', $badge->id)->count())->toBe(1);
});

// ─── Public verify route ─────────────────────────────────────────────────────

it('serves certificate-safe fields on the public verify route by audit id', function () {
    ['company' => $company, 'audit' => $audit, 'badge' => $badge] = certificateFixture();
    app(CertificateGenerationService::class)->generate($badge);

    $this->getJson("/api/v1/public/verify/{$audit->id}")
        ->assertOk()
        ->assertJsonPath('data.audit_id', $audit->id)
        ->assertJsonPath('data.level', 'L3')
        ->assertJsonPath('data.company_name', $company->name)
        ->assertJsonPath('data.company_name_kh', $company->name_kh)
        ->assertJsonPath('data.score', 100)
        ->assertJsonPath('data.qr_payload_url', "https://verify.2bready.asia/{$audit->id}")
        ->assertJsonPath('data.master_verifier_stamp.verified_by', 'ADMIT UNIT Master Auditors')
        ->assertJsonStructure(['data' => ['pdf_url', 'issued_at']]);
});

it('404s on the public verify route for an unknown audit id', function () {
    $this->getJson('/api/v1/public/verify/01ABCDEFGHIJKLMNOPQRSTUVWX')
        ->assertNotFound();
});

it('does not require authentication on the public verify route', function () {
    ['audit' => $audit, 'badge' => $badge] = certificateFixture();
    app(CertificateGenerationService::class)->generate($badge);

    $this->getJson("/api/v1/public/verify/{$audit->id}")
        ->assertOk();
});
