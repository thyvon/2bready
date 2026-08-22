<?php

declare(strict_types=1);

use App\Domain\AuditLog\Models\AuditLog;
use App\Domain\Company\Models\Company;
use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopCompany;
use App\Domain\Sop\Models\SopSignoff;
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

// ─── Effective content ──────────────────────────────────────────────────────

it('returns the adoption override as effective content', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create(['content_en' => 'Global English procedure']);
    SopCompany::factory()->create([
        'sop_id' => $sop->id,
        'company_id' => $company->id,
        'override_content_en' => 'Company-tuned English',
    ]);

    $this->actingAs($owner)->getJson("/api/v1/sops/{$sop->id}/effective-content")
        ->assertOk()
        ->assertJsonPath('data.content', 'Company-tuned English')
        ->assertJsonPath('data.source', 'override')
        ->assertJsonPath('data.locale', 'en');
});

it('returns the base content when the adoption has no override', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create(['content_en' => 'Global English procedure']);
    SopCompany::factory()->create([
        'sop_id' => $sop->id,
        'company_id' => $company->id,
        'override_content_en' => null,
    ]);

    $this->actingAs($owner)->getJson("/api/v1/sops/{$sop->id}/effective-content")
        ->assertOk()
        ->assertJsonPath('data.content', 'Global English procedure')
        ->assertJsonPath('data.source', 'base');
});

it('falls back to English when no Khmer variant exists', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create([
        'content_en' => 'Global English procedure',
        'content_kh' => null,
    ]);
    SopCompany::factory()->create([
        'sop_id' => $sop->id,
        'company_id' => $company->id,
        'override_content_kh' => null,
    ]);

    $this->actingAs($owner)->getJson("/api/v1/sops/{$sop->id}/effective-content?locale=kh")
        ->assertOk()
        ->assertJsonPath('data.locale', 'kh')
        ->assertJsonPath('data.content', 'Global English procedure');
});

it('returns the Khmer override for the kh locale', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create(['content_en' => 'Global English procedure']);
    SopCompany::factory()->create([
        'sop_id' => $sop->id,
        'company_id' => $company->id,
        'override_content_kh' => 'ដំណើរការខ្មែរ',
    ]);

    $this->actingAs($owner)->getJson("/api/v1/sops/{$sop->id}/effective-content?locale=kh")
        ->assertOk()
        ->assertJsonPath('data.content', 'ដំណើរការខ្មែរ')
        ->assertJsonPath('data.source', 'override');
});

it('lets a company owner read their own company SOP content', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->forCompany($company)->create(['content_en' => 'Our internal steps']);

    $this->actingAs($owner)->getJson("/api/v1/sops/{$sop->id}/effective-content")
        ->assertOk()
        ->assertJsonPath('data.content', 'Our internal steps')
        ->assertJsonPath('data.source', 'base')
        ->assertJsonPath('data.is_global', false);
});

it('gives admins without a company context the base content', function () {
    $admin = User::factory()->admin()->create();
    $sop = Sop::factory()->global()->create(['content_en' => 'Global English procedure']);

    $this->actingAs($admin)->getJson("/api/v1/sops/{$sop->id}/effective-content")
        ->assertOk()
        ->assertJsonPath('data.content', 'Global English procedure')
        ->assertJsonPath('data.source', 'base');
});

it('forbids reading a global SOP the company has not adopted', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();

    $this->actingAs($owner)->getJson("/api/v1/sops/{$sop->id}/effective-content")
        ->assertForbidden();
});

it('rejects an unknown locale for effective content', function () {
    $admin = User::factory()->admin()->create();
    $sop = Sop::factory()->global()->create();

    $this->actingAs($admin)->getJson("/api/v1/sops/{$sop->id}/effective-content?locale=fr")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['locale']);
});

// ─── Sign-offs (read & acknowledge) ─────────────────────────────────────────

it('lets a company owner assign employees for sign-off', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $employee = User::factory()->withRole('company_member')->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();
    SopCompany::factory()->create(['sop_id' => $sop->id, 'company_id' => $company->id]);

    $response = $this->actingAs($owner)->postJson("/api/v1/sops/{$sop->id}/signoffs", [
        'user_ids' => [$employee->id],
    ]);

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.user.id', $employee->id)
        ->assertJsonPath('data.0.signed_at', null);

    expect(SopSignoff::query()->where('sop_id', $sop->id)->where('user_id', $employee->id)->exists())->toBeTrue();
});

it('keeps a single sign-off row per employee when re-sending', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $employee = User::factory()->withRole('company_member')->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();
    SopCompany::factory()->create(['sop_id' => $sop->id, 'company_id' => $company->id]);

    foreach ([1, 2] as $i) {
        $this->actingAs($owner)->postJson("/api/v1/sops/{$sop->id}/signoffs", [
            'user_ids' => [$employee->id],
        ])->assertOk();
    }

    expect(SopSignoff::query()->where('sop_id', $sop->id)->count())->toBe(1);
});

it('rejects assigning users outside the company', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $outsider = User::factory()->withRole('company_member')->withCompany(Company::factory()->create())->create();
    $sop = Sop::factory()->global()->create();
    SopCompany::factory()->create(['sop_id' => $sop->id, 'company_id' => $company->id]);

    $this->actingAs($owner)->postJson("/api/v1/sops/{$sop->id}/signoffs", [
        'user_ids' => [$outsider->id],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['user_ids.0']);
});

it('rejects sending without user_ids', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();
    SopCompany::factory()->create(['sop_id' => $sop->id, 'company_id' => $company->id]);

    $this->actingAs($owner)->postJson("/api/v1/sops/{$sop->id}/signoffs", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['user_ids']);
});

it('forbids a company owner from sending sign-offs on an unadopted global SOP', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $employee = User::factory()->withRole('company_member')->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();

    $this->actingAs($owner)->postJson("/api/v1/sops/{$sop->id}/signoffs", [
        'user_ids' => [$employee->id],
    ])->assertForbidden();
});

it('lets the assigned employee acknowledge their sign-off', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $employee = User::factory()->withRole('company_member')->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();
    $signoff = SopSignoff::factory()->pending()->create([
        'sop_id' => $sop->id,
        'company_id' => $company->id,
        'user_id' => $employee->id,
        'sent_by_user_id' => $owner->id,
    ]);

    $response = $this->actingAs($employee)->postJson("/api/v1/signoffs/{$signoff->id}/acknowledge");

    $response->assertOk()->assertJsonPath('data.id', $signoff->id);
    expect($signoff->fresh()->signed_at)->not->toBeNull();

    $actions = AuditLog::query()->where('auditable_id', $signoff->id)->pluck('action');
    expect($actions)->toContain('sop_signoff_acknowledged');
});

it('is idempotent when acknowledging twice', function () {
    $company = Company::factory()->create();
    $employee = User::factory()->withRole('company_member')->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();
    $signoff = SopSignoff::factory()->acknowledged()->create([
        'sop_id' => $sop->id,
        'company_id' => $company->id,
        'user_id' => $employee->id,
    ]);
    $originalSignedAt = $signoff->signed_at;

    $this->actingAs($employee)->postJson("/api/v1/signoffs/{$signoff->id}/acknowledge")->assertOk();

    expect($signoff->fresh()->signed_at?->equalTo($originalSignedAt))->toBeTrue();
});

it('forbids acknowledging someone else\'s sign-off', function () {
    $company = Company::factory()->create();
    // A member of another company can't even see the record — the
    // BelongsToCompany scope 404s it before any policy check.
    $other = User::factory()->withRole('company_member')->withCompany(Company::factory()->create())->create();
    $sop = Sop::factory()->global()->create();
    $signoff = SopSignoff::factory()->pending()->create([
        'sop_id' => $sop->id,
        'company_id' => $company->id,
        'user_id' => User::factory()->create()->id,
    ]);

    $this->actingAs($other)->postJson("/api/v1/signoffs/{$signoff->id}/acknowledge")
        ->assertNotFound();
});

it('shows the tracking list with employee status', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $employeeA = User::factory()->withRole('company_member')->withCompany($company)->create();
    $sop = Sop::factory()->global()->create();
    SopCompany::factory()->create(['sop_id' => $sop->id, 'company_id' => $company->id]);
    SopSignoff::factory()->pending()->create([
        'sop_id' => $sop->id, 'company_id' => $company->id, 'user_id' => $employeeA->id,
    ]);

    $response = $this->actingAs($owner)->getJson("/api/v1/sops/{$sop->id}/signoffs");

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.user.id', $employeeA->id)
        ->assertJsonPath('data.0.signed_at', null);
});

it('requires authentication for sign-off endpoints', function () {
    $sop = Sop::factory()->global()->create();

    $this->getJson("/api/v1/sops/{$sop->id}/signoffs")->assertUnauthorized();
    $this->postJson("/api/v1/sops/{$sop->id}/signoffs", [])->assertUnauthorized();
});

it('lists only my own sign-offs on the mine endpoint', function () {
    $company = Company::factory()->create();
    $employee = User::factory()->withRole('company_member')->withCompany($company)->create();
    $colleague = User::factory()->withRole('company_member')->withCompany($company)->create();
    $sopA = Sop::factory()->global()->create(['title' => 'Safety Procedure']);
    $sopB = Sop::factory()->global()->create(['title' => 'Hygiene Procedure']);
    SopSignoff::factory()->pending()->create([
        'sop_id' => $sopA->id, 'company_id' => $company->id, 'user_id' => $employee->id,
    ]);
    SopSignoff::factory()->acknowledged()->create([
        'sop_id' => $sopB->id, 'company_id' => $company->id, 'user_id' => $employee->id,
    ]);
    SopSignoff::factory()->pending()->create([
        'sop_id' => $sopA->id, 'company_id' => $company->id, 'user_id' => $colleague->id,
    ]);

    $response = $this->actingAs($employee)->getJson('/api/v1/signoffs/mine')->assertOk();

    expect(collect($response->json('data')))->toHaveCount(2);
    // Pending first (ordered by signed_at nulls first), with SOP nested
    expect($response->json('data.0.signed_at'))->toBeNull();
    expect($response->json('data.0.sop.title'))->toBe('Safety Procedure');
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
