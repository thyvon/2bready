<?php

declare(strict_types=1);

use App\Domain\AuditLog\Models\AuditLog;
use App\Domain\Company\Models\Company;
use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopCompany;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Create ─────────────────────────────────────────────────────────────────

it('lets an admin create a global (platform-wide) SOP', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/sops', [
        'title' => 'Onboarding SOP',
        'version' => '1.0',
        'content_en' => 'English procedure',
        'content_kh' => 'ដំណើរការខ្មែរ',
        'is_active' => true,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.title', 'Onboarding SOP')
        ->assertJsonPath('data.version', '1.0')
        ->assertJsonPath('data.is_active', true)
        ->assertJsonPath('data.is_global', true);
});

it('lets a company owner create a SOP for their own company', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->postJson('/api/v1/sops', [
        'title' => 'Company Procedure',
        'version' => '2.1',
        'content_en' => 'Our internal steps',
        'is_active' => true,
    ])->assertCreated()
        ->assertJsonPath('data.company.id', $company->id)
        ->assertJsonPath('data.is_global', false);
});

it('forbids a company owner from targeting another company', function () {
    $company = Company::factory()->create();
    $other = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->postJson('/api/v1/sops', [
        'title' => 'Sneaky',
        'version' => '1.0',
        'content_en' => 'Nope',
        'company_id' => $other->id,
    ])->assertStatus(422);
});

it('rejects creating a SOP without required fields', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/sops', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['title', 'version', 'content_en']);
});

it('requires authentication for every sop endpoint', function () {
    $this->getJson('/api/v1/sops')->assertUnauthorized();
    $this->postJson('/api/v1/sops', [])->assertUnauthorized();
});

// ─── List / view ────────────────────────────────────────────────────────────

it('lets an admin list all SOPs', function () {
    $admin = User::factory()->admin()->create();
    Sop::factory()->global()->count(2)->create(['created_by_user_id' => $admin->id]);

    $this->actingAs($admin)->getJson('/api/v1/sops')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('scopes a company owner to their own SOPs and adopted globals', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $global = Sop::factory()->global()->active()->create();
    $own = Sop::factory()->create(['company_id' => $company->id]);
    Sop::factory()->create(['company_id' => Company::factory()->create()->id]);
    SopCompany::factory()->create([
        'sop_id' => $global->id,
        'company_id' => $company->id,
    ]);

    $response = $this->actingAs($owner)->getJson('/api/v1/sops')->assertOk();
    $ids = collect($response->json('data'))->pluck('id');

    expect($ids)->toContain($global->id);
    expect($ids)->toContain($own->id);
    expect($ids)->toHaveCount(2);
});

// ─── Update ─────────────────────────────────────────────────────────────────

it('lets an admin update a SOP and keeps fields it does not touch', function () {
    $admin = User::factory()->admin()->create();
    $sop = Sop::factory()->create(['title' => 'Before', 'is_active' => true]);

    $this->actingAs($admin)->putJson("/api/v1/sops/{$sop->id}", ['title' => 'After'])
        ->assertOk()
        ->assertJsonPath('data.title', 'After')
        ->assertJsonPath('data.is_active', true);
});

it('forbids a company owner from updating a global SOP', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();

    $this->actingAs($owner)->putJson("/api/v1/sops/{$sop->id}", ['title' => 'Hijack'])
        ->assertForbidden();
});

// ─── Activate / deactivate ──────────────────────────────────────────────────

it('lets an admin activate and deactivate a SOP', function () {
    $admin = User::factory()->admin()->create();
    $sop = Sop::factory()->create(['is_active' => false]);

    $this->actingAs($admin)->postJson("/api/v1/sops/{$sop->id}/activate", ['active' => true])
        ->assertOk()
        ->assertJsonPath('data.is_active', true);

    $this->actingAs($admin)->postJson("/api/v1/sops/{$sop->id}/activate", ['active' => false])
        ->assertOk()
        ->assertJsonPath('data.is_active', false);
});

it('deactivates competing active SOPs when a new one is activated', function () {
    $admin = User::factory()->admin()->create();
    $first = Sop::factory()->create(['title' => 'Policy', 'company_id' => null, 'is_active' => true]);
    $second = Sop::factory()->create(['title' => 'Policy', 'company_id' => null, 'is_active' => true]);

    $this->actingAs($admin)->postJson("/api/v1/sops/{$second->id}/activate", ['active' => true]);

    expect($first->fresh()->is_active)->toBeFalse();
    expect($second->fresh()->is_active)->toBeTrue();
});

// ─── Delete ─────────────────────────────────────────────────────────────────

it('lets an admin delete a SOP', function () {
    $admin = User::factory()->admin()->create();
    $sop = Sop::factory()->create();

    $this->actingAs($admin)->deleteJson("/api/v1/sops/{$sop->id}")
        ->assertOk()
        ->assertJsonPath('data.deleted', true);

    expect(Sop::withTrashed()->find($sop->id))->not->toBeNull();
});

it('forbids a company owner from deleting a global SOP', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();

    $this->actingAs($owner)->deleteJson("/api/v1/sops/{$sop->id}")->assertForbidden();
});

// ─── Adoption ───────────────────────────────────────────────────────────────

it('lets a company owner adopt a global SOP with overrides', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();

    $response = $this->actingAs($owner)->postJson("/api/v1/sops/{$sop->id}/adopt", [
        'override_content_en' => 'Company-tuned English',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.sop_company.company_id', $company->id)
        ->assertJsonPath('data.sop_company.override_content_en', 'Company-tuned English');
});

it('rejects adopting a company-specific SOP', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->forCompany($company)->create();

    // SopPolicy::adopt forbids adopting a company-specific SOP outright
    $this->actingAs($owner)->postJson("/api/v1/sops/{$sop->id}/adopt", [])
        ->assertForbidden();
});

it('lets a company owner unadopt their own adoption', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();
    $adoption = SopCompany::factory()->create([
        'sop_id' => $sop->id,
        'company_id' => $company->id,
    ]);

    $this->actingAs($owner)->deleteJson("/api/v1/sops/sop-companies/{$adoption->id}")
        ->assertOk();

    expect(SopCompany::query()->find($adoption->id))->toBeNull();
});

// ─── Audit log ──────────────────────────────────────────────────────────────

it('records SOP lifecycle actions in the audit log', function () {
    $admin = User::factory()->admin()->create();
    $sop = Sop::factory()->create(['company_id' => null, 'is_active' => false]);

    $this->actingAs($admin)->postJson("/api/v1/sops/{$sop->id}/activate", ['active' => true])->assertOk();
    $this->actingAs($admin)->deleteJson("/api/v1/sops/{$sop->id}")->assertOk();

    $actions = AuditLog::query()->where('auditable_id', $sop->id)->orderBy('created_at')->pluck('action');

    expect($actions)->toContain('sop_activated');
    expect($actions)->toContain('sop_deleted');
});
