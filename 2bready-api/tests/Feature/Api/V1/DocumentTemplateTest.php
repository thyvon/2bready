<?php

declare(strict_types=1);

use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

it('lets an admin add a document template to a milestone', function () {
    $milestone = Milestone::factory()->create();
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson("/api/v1/milestones/{$milestone->id}/document-templates", [
        'name' => 'Business Registration Certificate',
        'is_required' => true,
        'expiry_months' => 12,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Business Registration Certificate')
        ->assertJsonPath('data.milestone_id', $milestone->id)
        ->assertJsonPath('data.expiry_months', 12);
});

it('rejects document template creation without a name', function () {
    $milestone = Milestone::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/v1/milestones/{$milestone->id}/document-templates", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('forbids staff without document_template.manage — company_owner rejected', function () {
    $milestone = Milestone::factory()->create();
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->postJson("/api/v1/milestones/{$milestone->id}/document-templates", [
        'name' => 'Business Registration Certificate',
    ])->assertForbidden();
});

it('lets an admin update and delete a document template', function () {
    $documentTemplate = DocumentTemplate::factory()->create(['name' => 'Old Name']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/document-templates/{$documentTemplate->id}", [
        'name' => 'New Name',
    ])->assertOk()->assertJsonPath('data.name', 'New Name');

    $this->actingAs($admin)->deleteJson("/api/v1/document-templates/{$documentTemplate->id}")->assertNoContent();
    $this->assertSoftDeleted('document_templates', ['id' => $documentTemplate->id]);
});

it('requires authentication to create a document template', function () {
    $milestone = Milestone::factory()->create();

    $this->postJson("/api/v1/milestones/{$milestone->id}/document-templates", [
        'name' => 'Business Registration Certificate',
    ])->assertUnauthorized();
});
