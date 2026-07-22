<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Actions\ExpireOverdueDocumentsAction;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Actions\CompleteMilestoneAction;
use App\Domain\Journey\Enums\MilestoneCompletionTrigger;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Models\MilestoneCompletion;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $template = JourneyTemplate::factory()->create();
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id]);
    $this->milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    $this->docTemplate = DocumentTemplate::factory()->create(['milestone_id' => $this->milestone->id]);
    $this->company = Company::factory()->create();
});

it('flips a verified document past its expires_at to expired', function () {
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'verified',
        'expires_at' => now()->subDay(),
    ]);

    $count = app(ExpireOverdueDocumentsAction::class)->execute();

    expect($count)->toBe(1);
    expect($document->fresh()->status->value)->toBe('expired');
});

it('leaves a verified document alone if it has not expired yet', function () {
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'verified',
        'expires_at' => now()->addMonth(),
    ]);

    app(ExpireOverdueDocumentsAction::class)->execute();

    expect($document->fresh()->status->value)->toBe('verified');
});

it('leaves a permanent (expires_at null) document alone', function () {
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'verified',
        'expires_at' => null,
    ]);

    app(ExpireOverdueDocumentsAction::class)->execute();

    expect($document->fresh()->status->value)->toBe('verified');
});

it('does not touch a non-verified document even if its expires_at is in the past', function () {
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'rejected',
        'expires_at' => now()->subDay(),
    ]);

    app(ExpireOverdueDocumentsAction::class)->execute();

    expect($document->fresh()->status->value)->toBe('rejected');
});

it('reverts the milestone completion backed by an expired document', function () {
    Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'verified',
        'expires_at' => now()->subDay(),
    ]);
    app(CompleteMilestoneAction::class)->execute($this->company, $this->milestone, null, MilestoneCompletionTrigger::DocumentUpload);
    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->exists())->toBeTrue();

    app(ExpireOverdueDocumentsAction::class)->execute();

    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->exists())->toBeFalse();
});

it('recreates the milestone completion once a fresh document is verified after expiry', function () {
    $document = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'verified',
        'expires_at' => now()->subDay(),
    ]);
    app(CompleteMilestoneAction::class)->execute($this->company, $this->milestone, null, MilestoneCompletionTrigger::DocumentUpload);
    app(ExpireOverdueDocumentsAction::class)->execute();
    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->exists())->toBeFalse();

    $admin = User::factory()->admin()->create();
    $fresh = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'review',
    ]);
    $this->actingAs($admin)->postJson("/api/v1/documents/{$fresh->id}/verify")->assertOk();

    expect(MilestoneCompletion::where('company_id', $this->company->id)->where('milestone_id', $this->milestone->id)->exists())->toBeTrue();
});

it('expires documents across every company in one sweep', function () {
    $otherCompany = Company::factory()->create();
    $doc1 = Document::factory()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'verified',
        'expires_at' => now()->subDay(),
    ]);
    $doc2 = Document::factory()->create([
        'company_id' => $otherCompany->id,
        'document_template_id' => $this->docTemplate->id,
        'status' => 'verified',
        'expires_at' => now()->subDay(),
    ]);

    $count = app(ExpireOverdueDocumentsAction::class)->execute();

    expect($count)->toBe(2);
    expect($doc1->fresh()->status->value)->toBe('expired');
    expect($doc2->fresh()->status->value)->toBe('expired');
});
