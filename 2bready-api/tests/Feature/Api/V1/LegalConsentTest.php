<?php

declare(strict_types=1);

use App\Domain\AuditLog\Models\AuditLog;
use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\LegalConsent\Enums\PathwayLevel;
use App\Domain\LegalConsent\Models\LegalConsent;
use App\Domain\User\Models\User;
use Database\Seeders\PlatformSettingSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([RolePermissionSeeder::class, PlatformSettingSeeder::class]);

    $this->company = Company::factory()->create();

    $template = JourneyTemplate::factory()->create();
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L3']);
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    $docTemplate = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
    $this->restrictedDocument = Document::factory()->verified()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $docTemplate->id,
        'file_path' => "documents/{$this->company->id}/l3.pdf",
        'mime_type' => 'application/pdf',
    ]);

    $this->owner = User::factory()->companyOwner()->withCompany($this->company)->create();
});

// ─── Status ─────────────────────────────────────────────────────────────────

it('reports consent_required for a restricted level the user has not accepted', function () {
    $this->actingAs($this->owner)->getJson('/api/v1/legal-consent/status?journey_level=L3')
        ->assertOk()
        ->assertJsonPath('data.consent_required', true)
        ->assertJsonPath('data.accepted', false)
        ->assertJsonPath('data.version', 'v1')
        ->assertJsonStructure(['data' => ['text_en', 'text_kh']]);
});

it('reports accepted for a restricted level the user has consented to', function () {
    $this->actingAs($this->owner)->postJson('/api/v1/legal-consent/accept', ['journey_level' => 'L3']);

    $this->actingAs($this->owner)->getJson('/api/v1/legal-consent/status?journey_level=L3')
        ->assertOk()
        ->assertJsonPath('data.accepted', true);
});

it('reports no consent required for an unrestricted level', function () {
    $this->actingAs($this->owner)->getJson('/api/v1/legal-consent/status?journey_level=L1')
        ->assertOk()
        ->assertJsonPath('data.consent_required', false)
        ->assertJsonPath('data.accepted', false);
});

it('requires authentication for the consent status endpoint', function () {
    $this->getJson('/api/v1/legal-consent/status?journey_level=L3')->assertUnauthorized();
});

// ─── Accept ─────────────────────────────────────────────────────────────────

it('records a legal consent with the current version and an audit-log entry', function () {
    $this->actingAs($this->owner)->postJson('/api/v1/legal-consent/accept', ['journey_level' => 'L3'])
        ->assertCreated()
        ->assertJsonPath('data.accepted', true)
        ->assertJsonPath('data.version', 'v1');

    $consent = LegalConsent::query()->withoutGlobalScope('company')
        ->where('user_id', $this->owner->id)
        ->where('company_id', $this->company->id)
        ->firstOrFail();

    expect($consent->pathway_level)->toBe(PathwayLevel::P3);
    expect($consent->consent_text_version)->toBe('v1');

    $audit = AuditLog::query()->withoutGlobalScope('company')
        ->where('company_id', $this->company->id)
        ->where('action', 'legal_consent_recorded')
        ->first();

    expect($audit)->not->toBeNull();
    expect($audit->auditable_id)->toBe($consent->id);
});

it('rejects a journey_level outside the allowed restricted levels', function () {
    $this->actingAs($this->owner)->postJson('/api/v1/legal-consent/accept', ['journey_level' => 'L2'])
        ->assertUnprocessable();
});

it('rejects an unknown journey_level', function () {
    $this->actingAs($this->owner)->postJson('/api/v1/legal-consent/accept', ['journey_level' => 'L9'])
        ->assertUnprocessable();
});

it('requires authentication to accept a consent', function () {
    $this->postJson('/api/v1/legal-consent/accept', ['journey_level' => 'L3'])->assertUnauthorized();
});

it('forbids a back-office user who does not belong to a company', function () {
    $staff = User::factory()->withRole('staff')->create();

    $this->actingAs($staff)->postJson('/api/v1/legal-consent/accept', ['journey_level' => 'L3'])->assertNotFound();
});

// ─── Gate in DocumentPolicy::view ───────────────────────────────────────────

it('blocks a company_owner from previewing a restricted document without consent', function () {
    $this->actingAs($this->owner)->getJson("/api/v1/documents/{$this->restrictedDocument->id}/preview-url")
        ->assertForbidden();
});

it('lets a company_owner preview a restricted document after accepting consent', function () {
    $this->actingAs($this->owner)->postJson('/api/v1/legal-consent/accept', ['journey_level' => 'L3']);

    $this->actingAs($this->owner)->getJson("/api/v1/documents/{$this->restrictedDocument->id}/preview-url")
        ->assertOk();
});

it('does not gate unrestricted L1 document previews behind consent', function () {
    $l1Template = JourneyTemplate::factory()->create();
    $l1 = JourneyLevel::factory()->create(['journey_template_id' => $l1Template->id, 'code' => 'L1']);
    $l1Milestone = Milestone::factory()->create(['journey_level_id' => $l1->id]);
    $l1DocTemplate = DocumentTemplate::factory()->create(['milestone_id' => $l1Milestone->id]);
    $plain = Document::factory()->verified()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $l1DocTemplate->id,
        'file_path' => "documents/{$this->company->id}/l1.pdf",
        'mime_type' => 'application/pdf',
    ]);

    $this->actingAs($this->owner)->getJson("/api/v1/documents/{$plain->id}/preview-url")->assertOk();
});

it('does not gate back-office review behind client consent', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->postJson('/api/v1/vault/pin', ['company_id' => $this->company->id, 'pin' => '123456']);
    $this->actingAs($admin)->postJson('/api/v1/vault/unlock', ['company_id' => $this->company->id, 'pin' => '123456']);

    // No client consent accepted — but back-office is exempt, gated by Vault.
    $this->actingAs($admin)->getJson("/api/v1/documents/{$this->restrictedDocument->id}/preview-url")->assertOk();
});
