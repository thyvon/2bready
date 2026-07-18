<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
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

// ─── Nested sub-documents ────────────────────────────────────────────────────

it('lets an admin add a sub-document under an existing document template', function () {
    $parent = DocumentTemplate::factory()->create(['name' => 'Business License']);
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson("/api/v1/document-templates/{$parent->id}/children", [
        'name' => 'Business License — Translated Copy',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.parent_id', $parent->id)
        ->assertJsonPath('data.milestone_id', $parent->milestone_id);
});

it('nests sub-documents to more than one level deep in the journey template tree', function () {
    $milestone = Milestone::factory()->create();
    $root = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id, 'name' => 'Root']);
    $child = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id, 'parent_id' => $root->id, 'name' => 'Child']);
    DocumentTemplate::factory()->create(['milestone_id' => $milestone->id, 'parent_id' => $child->id, 'name' => 'Grandchild']);
    $admin = User::factory()->admin()->create();
    $journeyTemplate = $milestone->journeyLevel->journeyTemplate;

    $response = $this->actingAs($admin)->getJson("/api/v1/journey-templates/{$journeyTemplate->id}");

    $response->assertOk();
    $path = 'data.levels.0.milestones.0.document_templates.0';
    $response->assertJsonPath("{$path}.name", 'Root')
        ->assertJsonPath("{$path}.children.0.name", 'Child')
        ->assertJsonPath("{$path}.children.0.children.0.name", 'Grandchild');
});

// ─── Company-specific extras ─────────────────────────────────────────────────

it('lets an admin add a company-specific extra document requirement', function () {
    $milestone = Milestone::factory()->create();
    $company = Company::factory()->create();
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson("/api/v1/companies/{$company->id}/milestones/{$milestone->id}/document-templates", [
        'name' => 'Extra Requirement',
    ]);

    $response->assertCreated()->assertJsonPath('data.company_id', $company->id);
});

it('lets an admin add a company-specific extra nested under an existing document template', function () {
    $parent = DocumentTemplate::factory()->create();
    $company = Company::factory()->create();
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson("/api/v1/companies/{$company->id}/document-templates/{$parent->id}/children", [
        'name' => 'Extra Sub-Requirement',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.company_id', $company->id)
        ->assertJsonPath('data.parent_id', $parent->id);
});

it('rejects attaching a company extra under a document template that belongs to a different company', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();
    $parentOwnedByA = DocumentTemplate::factory()->create(['company_id' => $companyA->id]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/v1/companies/{$companyB->id}/document-templates/{$parentOwnedByA->id}/children", [
        'name' => 'Extra Sub-Requirement',
    ])->assertUnprocessable()->assertJsonValidationErrors(['document_template']);
});

it('forbids a company_owner from adding their own company-specific extra', function () {
    $milestone = Milestone::factory()->create();
    $owner = User::factory()->companyOwner()->create();
    $company = Company::factory()->create();

    $this->actingAs($owner)->postJson("/api/v1/companies/{$company->id}/milestones/{$milestone->id}/document-templates", [
        'name' => 'Extra Requirement',
    ])->assertForbidden();
});
