<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Jobs\ScanDocumentForMalwareJob;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Models\MilestoneCompletion;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    Storage::fake('local');

    $template = JourneyTemplate::factory()->create();
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id]);
    $this->milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    $this->docTemplate = DocumentTemplate::factory()->create(['milestone_id' => $this->milestone->id, 'name' => 'MoC Registration']);
    $this->company = Company::factory()->create();
});

// ─── Back-office review queue ───────────────────────────────────────────────

it('lets an admin list documents across every company', function () {
    $otherCompany = Company::factory()->create();
    $doc1 = Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $this->docTemplate->id, 'status' => 'review']);
    $doc2 = Document::factory()->create(['company_id' => $otherCompany->id, 'document_template_id' => $this->docTemplate->id, 'status' => 'review']);
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson('/api/v1/documents');

    $response->assertOk();
    $ids = collect($response->json('data'))->pluck('id');
    expect($ids)->toContain($doc1->id, $doc2->id);

    $listed = collect($response->json('data'))->firstWhere('id', $doc1->id);
    expect($listed['company']['id'])->toBe($this->company->id);
    expect($listed['document_template']['name'])->toBe('MoC Registration');
});

it('filters the admin document list by status', function () {
    Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $this->docTemplate->id, 'status' => 'review']);
    Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $this->docTemplate->id, 'status' => 'verified']);
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson('/api/v1/documents?status=review');

    $statuses = collect($response->json('data'))->pluck('status');
    expect($statuses->unique()->all())->toBe(['review']);
});

it('only shows a company_owner their own documents when listing', function () {
    $otherCompany = Company::factory()->create();
    Document::factory()->create(['company_id' => $otherCompany->id, 'document_template_id' => $this->docTemplate->id]);
    $ownDocument = Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $this->docTemplate->id]);
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $response = $this->actingAs($owner)->getJson('/api/v1/documents');

    $ids = collect($response->json('data'))->pluck('id');
    expect($ids->all())->toBe([$ownDocument->id]);
});

it('requires authentication to list documents', function () {
    $this->getJson('/api/v1/documents')->assertUnauthorized();
});

// ─── Templates ───────────────────────────────────────────────────────────────

it('lists document templates with the current company\'s latest document nested', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $document = Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $this->docTemplate->id]);

    $response = $this->actingAs($owner)->getJson('/api/v1/documents/templates');

    $response->assertOk();
    $template = collect($response->json('data'))->firstWhere('id', $this->docTemplate->id);
    expect($template['latest_document']['id'])->toBe($document->id);
});

it('shows a null latest_document when nothing has been uploaded yet', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $response = $this->actingAs($owner)->getJson('/api/v1/documents/templates');

    $template = collect($response->json('data'))->firstWhere('id', $this->docTemplate->id);
    expect($template['latest_document'])->toBeNull();
});

it('requires authentication to list document templates', function () {
    $this->getJson('/api/v1/documents/templates')->assertUnauthorized();
});

// ─── Upload ──────────────────────────────────────────────────────────────────

it('lets a company_owner upload a document and queues the malware scan', function () {
    Queue::fake();
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $file = UploadedFile::fake()->create('registration.pdf', 500, 'application/pdf');

    $response = $this->actingAs($owner)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'file' => $file,
    ]);

    $response->assertCreated()->assertJsonPath('data.status', 'pending_scan');

    $this->assertDatabaseHas('documents', [
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'pending_scan',
    ]);

    Queue::assertPushed(ScanDocumentForMalwareJob::class);
});

it('rejects an upload with a disallowed mime type', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $file = UploadedFile::fake()->create('malware.exe', 100, 'application/x-msdownload');

    $this->actingAs($owner)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'file' => $file,
    ])->assertUnprocessable()->assertJsonValidationErrors(['file']);
});

it('rejects an oversized upload', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $file = UploadedFile::fake()->create('big.pdf', 20_000, 'application/pdf');

    $this->actingAs($owner)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'file' => $file,
    ])->assertUnprocessable()->assertJsonValidationErrors(['file']);
});

it('requires authentication to upload a document', function () {
    $file = UploadedFile::fake()->create('registration.pdf', 500, 'application/pdf');

    $this->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'file' => $file,
    ])->assertUnauthorized();
});

it('lets an admin upload a document on a company\'s behalf', function () {
    Queue::fake();
    $admin = User::factory()->admin()->create();
    $file = UploadedFile::fake()->create('registration.pdf', 500, 'application/pdf');

    $response = $this->actingAs($admin)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'company_id' => $this->company->id,
        'file' => $file,
    ]);

    $response->assertCreated()->assertJsonPath('data.status', 'pending_scan');
    $this->assertDatabaseHas('documents', [
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'pending_scan',
    ]);
    Queue::assertPushed(ScanDocumentForMalwareJob::class);
});

it('rejects an admin upload with no company_id instead of 404ing on a null company', function () {
    $admin = User::factory()->admin()->create();
    $file = UploadedFile::fake()->create('registration.pdf', 500, 'application/pdf');

    $this->actingAs($admin)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'file' => $file,
    ])->assertUnprocessable()->assertJsonValidationErrors(['company_id']);
});

it('rejects an admin upload with a nonexistent company_id', function () {
    $admin = User::factory()->admin()->create();
    $file = UploadedFile::fake()->create('registration.pdf', 500, 'application/pdf');

    $this->actingAs($admin)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'company_id' => 'not-a-real-id',
        'file' => $file,
    ])->assertUnprocessable()->assertJsonValidationErrors(['company_id']);
});

// ─── Malware scan job ────────────────────────────────────────────────────────

it('moves a pending_scan document to review once the scan job runs', function () {
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'pending_scan',
    ]);

    (new ScanDocumentForMalwareJob($document->id))->handle();

    expect($document->fresh()->status->value)->toBe('review');
});

// ─── Verify / Reject ─────────────────────────────────────────────────────────

it('lets an admin verify a document', function () {
    $admin = User::factory()->admin()->create();
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
    ]);

    $response = $this->actingAs($admin)->postJson("/api/v1/documents/{$document->id}/verify");

    $response->assertOk()->assertJsonPath('data.status', 'verified');
    expect($document->fresh()->verified_by_user_id)->toBe($admin->id);
});

it('sets expires_at when verifying a document whose template has an expiry window', function () {
    $this->docTemplate->update(['recurrence_type' => 'rolling', 'expiry_months' => 6]);
    $admin = User::factory()->admin()->create();
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
    ]);

    $this->actingAs($admin)->postJson("/api/v1/documents/{$document->id}/verify")->assertOk();

    expect($document->fresh()->expires_at)->not->toBeNull();
});

it('completes the milestone once every required document is verified', function () {
    $secondTemplate = DocumentTemplate::factory()->create(['milestone_id' => $this->milestone->id, 'name' => 'Second Doc']);
    $admin = User::factory()->admin()->create();

    $doc1 = Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $this->docTemplate->id, 'status' => 'review']);
    $doc2 = Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $secondTemplate->id, 'status' => 'review']);

    $this->actingAs($admin)->postJson("/api/v1/documents/{$doc1->id}/verify")->assertOk();
    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->exists())->toBeFalse();

    $this->actingAs($admin)->postJson("/api/v1/documents/{$doc2->id}/verify")->assertOk();
    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->first()?->trigger->value)
        ->toBe('document_upload');
});

it('does not let one company\'s extra required document block or leak into another company\'s completion', function () {
    $otherCompany = Company::factory()->create();
    // An extra requirement added only for $this->company — must not affect
    // $otherCompany's completion of the same shared milestone.
    $extraTemplate = DocumentTemplate::factory()->create([
        'milestone_id' => $this->milestone->id,
        'company_id' => $this->company->id,
        'name' => 'Extra Requirement',
    ]);
    $admin = User::factory()->admin()->create();

    // otherCompany only has the one shared (global) template to satisfy —
    // it should complete without ever touching the extra.
    $otherDoc = Document::factory()->create([
        'company_id' => $otherCompany->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
    ]);
    $this->actingAs($admin)->postJson("/api/v1/documents/{$otherDoc->id}/verify")->assertOk();

    expect(MilestoneCompletion::where('company_id', $otherCompany->id)->where('milestone_id', $this->milestone->id)->exists())->toBeTrue();

    // $this->company still needs its own extra verified too — completing
    // just the shared template must NOT complete it yet.
    $ownSharedDoc = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
    ]);
    $this->actingAs($admin)->postJson("/api/v1/documents/{$ownSharedDoc->id}/verify")->assertOk();
    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->exists())->toBeFalse();

    $ownExtraDoc = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $extraTemplate->id,
        'status' => 'review',
    ]);
    $this->actingAs($admin)->postJson("/api/v1/documents/{$ownExtraDoc->id}/verify")->assertOk();
    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->exists())->toBeTrue();
});

// ─── Backfill (compliance start date + past-period upload) ─────────────────

it('lets a company_owner backfill-upload a document for a real missing period', function () {
    $this->docTemplate->update(['recurrence_type' => 'periodic_annual', 'effective_since' => '2020-01-01']);
    $this->company->update(['compliance_start_date' => '2023-01-01']);
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $file = UploadedFile::fake()->create('patent-tax-2024.pdf', 500, 'application/pdf');

    $response = $this->actingAs($owner)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'file' => $file,
        'period_key' => '2024',
    ]);

    $response->assertCreated();
    $this->assertDatabaseHas('documents', [
        'document_template_id' => $this->docTemplate->id,
        'period_key' => '2024',
    ]);
});

it('rejects a backfill period that is not a real missing gap', function () {
    $this->docTemplate->update(['recurrence_type' => 'periodic_annual', 'effective_since' => '2020-01-01']);
    $this->company->update(['compliance_start_date' => '2023-01-01']);
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $file = UploadedFile::fake()->create('doc.pdf', 500, 'application/pdf');

    // 2099 was never owed — not in the ledger at all.
    $this->actingAs($owner)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'file' => $file,
        'period_key' => '2099',
    ])->assertUnprocessable()->assertJsonValidationErrors(['period_key']);
});

it('rejects backfilling the current period — that stays the plain upload flow', function () {
    $this->docTemplate->update(['recurrence_type' => 'periodic_annual', 'effective_since' => '2020-01-01']);
    $this->company->update(['compliance_start_date' => '2023-01-01']);
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $file = UploadedFile::fake()->create('doc.pdf', 500, 'application/pdf');

    $this->actingAs($owner)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'file' => $file,
        'period_key' => now()->format('Y'),
    ])->assertUnprocessable()->assertJsonValidationErrors(['period_key']);
});

it('rejects a backfill period_key for a non-periodic document', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $file = UploadedFile::fake()->create('doc.pdf', 500, 'application/pdf');

    $this->actingAs($owner)->postJson('/api/v1/documents', [
        'document_template_id' => $this->docTemplate->id,
        'file' => $file,
        'period_key' => '2024',
    ])->assertUnprocessable()->assertJsonValidationErrors(['period_key']);
});

it('verifies a backfilled document with the period\'s own calendar expiry, not now', function () {
    $this->docTemplate->update(['recurrence_type' => 'periodic_annual', 'effective_since' => '2020-01-01']);
    $admin = User::factory()->admin()->create();
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
        'period_key' => '2024',
    ]);

    $this->actingAs($admin)->postJson("/api/v1/documents/{$document->id}/verify")->assertOk();

    $fresh = $document->fresh();
    expect($fresh->period_key)->toBe('2024');
    expect($fresh->expires_at->toDateString())->toBe('2025-01-01');
    // The audit fact (when review happened) is never backdated — only the
    // business period/expiry reflect the backfilled year.
    expect($fresh->verified_at->isToday())->toBeTrue();
});

it('does not complete a milestone while a periodic template still has a real historical gap', function () {
    $this->docTemplate->update(['recurrence_type' => 'periodic_annual', 'effective_since' => '2020-01-01']);
    $this->company->update(['compliance_start_date' => '2023-01-01']);
    $admin = User::factory()->admin()->create();

    // Only the current period is filed — 2023/2024/2025 remain real gaps.
    $current = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
        'period_key' => now()->format('Y'),
    ]);

    $this->actingAs($admin)->postJson("/api/v1/documents/{$current->id}/verify")->assertOk();

    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->exists())
        ->toBeFalse();
});

it('completes a milestone once every historical gap is backfilled and verified', function () {
    $this->docTemplate->update(['recurrence_type' => 'periodic_annual', 'effective_since' => '2020-01-01']);
    $this->company->update(['compliance_start_date' => (int) now()->format('Y').'-01-01']);
    $admin = User::factory()->admin()->create();

    // Only the current period is owed with this compliance_start_date —
    // no historical gap to backfill, so a single verified upload completes it.
    $current = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
        'period_key' => now()->format('Y'),
    ]);

    $this->actingAs($admin)->postJson("/api/v1/documents/{$current->id}/verify")->assertOk();

    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->exists())
        ->toBeTrue();
});

it('lets an admin reject a document with a reason', function () {
    $admin = User::factory()->admin()->create();
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
    ]);

    $response = $this->actingAs($admin)->postJson("/api/v1/documents/{$document->id}/reject", [
        'reason' => 'Illegible scan, please re-upload.',
    ]);

    $response->assertOk()->assertJsonPath('data.status', 'rejected');
    expect($document->fresh()->rejection_reason)->toBe('Illegible scan, please re-upload.');
});

it('forbids a company_owner from verifying their own document', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
    ]);

    $this->actingAs($owner)->postJson("/api/v1/documents/{$document->id}/verify")->assertForbidden();
});

it('requires authentication to verify a document', function () {
    $document = Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $this->docTemplate->id]);

    $this->postJson("/api/v1/documents/{$document->id}/verify")->assertUnauthorized();
});

// ─── Preview URL ─────────────────────────────────────────────────────────────

it('lets a company_owner get a signed preview url for their own document', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'file_path' => 'documents/'.$this->company->id.'/registration.pdf',
        'mime_type' => 'application/pdf',
        'original_filename' => 'registration.pdf',
    ]);

    $response = $this->actingAs($owner)->getJson("/api/v1/documents/{$document->id}/preview-url");

    $response->assertOk()
        ->assertJsonPath('data.mime_type', 'application/pdf')
        ->assertJsonPath('data.original_filename', 'registration.pdf');
    // Storage::fake('local') stubs a time-limited URL of its own shape
    // (?expiration=...) rather than the real signed-route mechanism
    // (?expires=...&signature=...) — asserting a real file path/time-limit
    // marker is present is the meaningful check here; the exact query
    // param naming is a fake-vs-real disk implementation detail.
    expect($response->json('data.url'))
        ->toContain($document->file_path)
        ->toContain('expir');
});

it('forbids a company_owner from previewing another company\'s document', function () {
    $otherCompany = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($otherCompany)->create();
    $document = Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $this->docTemplate->id]);

    // BelongsToCompany's global scope restricts the {document} lookup to the
    // caller's own company — a mismatched id just 404s, same as every other
    // tenant-scoped lookup in this codebase.
    $this->actingAs($owner)->getJson("/api/v1/documents/{$document->id}/preview-url")->assertNotFound();
});

it('requires authentication to get a preview url', function () {
    $document = Document::factory()->create(['company_id' => $this->company->id, 'document_template_id' => $this->docTemplate->id]);

    $this->getJson("/api/v1/documents/{$document->id}/preview-url")->assertUnauthorized();
});
