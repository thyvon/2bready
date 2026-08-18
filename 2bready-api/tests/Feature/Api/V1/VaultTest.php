<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\User\Models\User;
use App\Domain\Vault\Enums\VaultLockReason;
use App\Domain\Vault\Models\VaultUnlockLog;
use Database\Seeders\PlatformSettingSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([RolePermissionSeeder::class, PlatformSettingSeeder::class]);

    $this->company = Company::factory()->create();

    // A verified L3 document — the sensitive tier the vault gates. Non-L3/L4
    // docs must NOT be vault-gated, so the L1 twin proves the gate is scoped
    // to sensitive levels only.
    $template = JourneyTemplate::factory()->create();
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L3']);
    $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
    $docTemplate = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id]);
    $this->sensitiveDocument = Document::factory()->verified()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $docTemplate->id,
        'file_path' => "documents/{$this->company->id}/l3.pdf",
        'mime_type' => 'application/pdf',
    ]);

    $l1 = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L1']);
    $l1Milestone = Milestone::factory()->create(['journey_level_id' => $l1->id]);
    $l1DocTemplate = DocumentTemplate::factory()->create(['milestone_id' => $l1Milestone->id]);
    $this->plainDocument = Document::factory()->verified()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $l1DocTemplate->id,
        'file_path' => "documents/{$this->company->id}/l1.pdf",
        'mime_type' => 'application/pdf',
    ]);
});

function vaultPin(): string
{
    return '123456';
}

// ─── Set / rotate PIN ───────────────────────────────────────────────────────

it('lets an admin set a company vault PIN', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/vault/pin', [
        'company_id' => $this->company->id,
        'pin' => vaultPin(),
    ])->assertOk()->assertJsonPath('data.pin_set', true);

    expect(Hash::check(vaultPin(), (string) $this->company->fresh()->vault_pin_hash))->toBeTrue();
});

it('rejects a PIN that is not the configured length', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/vault/pin', [
        'company_id' => $this->company->id,
        'pin' => '123', // length 3, configured length is 6
    ])->assertUnprocessable();

    expect($this->company->fresh()->vault_pin_hash)->toBeNull();
});

it('forbids staff from setting a vault PIN', function () {
    $staff = User::factory()->withRole('staff')->create();

    $this->actingAs($staff)->postJson('/api/v1/vault/pin', [
        'company_id' => $this->company->id,
        'pin' => vaultPin(),
    ])->assertForbidden();
});

it('requires authentication to set a vault PIN', function () {
    $this->postJson('/api/v1/vault/pin', [
        'company_id' => $this->company->id,
        'pin' => vaultPin(),
    ])->assertUnauthorized();
});

// ─── Unlock / lock sessions ─────────────────────────────────────────────────

it('lets an admin unlock the vault with the correct PIN', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->postJson('/api/v1/vault/pin', ['company_id' => $this->company->id, 'pin' => vaultPin()]);

    $this->actingAs($admin)->postJson('/api/v1/vault/unlock', [
        'company_id' => $this->company->id,
        'pin' => vaultPin(),
    ])->assertOk()->assertJsonPath('data.unlocked', true);

    expect(VaultUnlockLog::query()->where('user_id', $admin->id)->where('company_id', $this->company->id)->firstOrFail()->isOpen())->toBeTrue();
});

it('rejects a wrong PIN', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->postJson('/api/v1/vault/pin', ['company_id' => $this->company->id, 'pin' => vaultPin()]);

    $this->actingAs($admin)->postJson('/api/v1/vault/unlock', [
        'company_id' => $this->company->id,
        'pin' => '654321',
    ])->assertStatus(422);

    expect(VaultUnlockLog::query()->where('company_id', $this->company->id)->count())->toBe(0);
});

it('rejects unlock before any PIN is set', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/vault/unlock', [
        'company_id' => $this->company->id,
        'pin' => vaultPin(),
    ])->assertStatus(422);
});

it('forbids company_owner from unlocking the vault', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $this->actingAs($owner)->postJson('/api/v1/vault/unlock', [
        'company_id' => $this->company->id,
        'pin' => vaultPin(),
    ])->assertForbidden();
});

it('lets an admin lock the vault manually', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->postJson('/api/v1/vault/pin', ['company_id' => $this->company->id, 'pin' => vaultPin()]);
    $this->actingAs($admin)->postJson('/api/v1/vault/unlock', ['company_id' => $this->company->id, 'pin' => vaultPin()]);

    $this->actingAs($admin)->postJson('/api/v1/vault/lock', ['company_id' => $this->company->id])
        ->assertOk()->assertJsonPath('data.unlocked', false);

    $log = VaultUnlockLog::query()->where('user_id', $admin->id)->where('company_id', $this->company->id)->firstOrFail();
    expect($log->isOpen())->toBeFalse();
    expect($log->lock_reason)->toBe(VaultLockReason::Manual);
});

// ─── Sensitive-document gate in DocumentPolicy::view ────────────────────────

it('blocks a sensitive L3 preview until the vault is unlocked', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->postJson('/api/v1/vault/pin', ['company_id' => $this->company->id, 'pin' => vaultPin()]);

    $this->actingAs($admin)->getJson("/api/v1/documents/{$this->sensitiveDocument->id}/preview-url")->assertForbidden();

    $this->actingAs($admin)->postJson('/api/v1/vault/unlock', ['company_id' => $this->company->id, 'pin' => vaultPin()]);
    $this->actingAs($admin)->getJson("/api/v1/documents/{$this->sensitiveDocument->id}/preview-url")->assertOk();
});

it('does not gate non-sensitive L1 previews behind the vault', function () {
    $admin = User::factory()->admin()->create();

    // No PIN set, no unlock — still fine for an ordinary document.
    $this->actingAs($admin)->getJson("/api/v1/documents/{$this->plainDocument->id}/preview-url")->assertOk();
});

it('auto-locks a session after the configured idle timeout', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->postJson('/api/v1/vault/pin', ['company_id' => $this->company->id, 'pin' => vaultPin()]);
    $this->actingAs($admin)->postJson('/api/v1/vault/unlock', ['company_id' => $this->company->id, 'pin' => vaultPin()]);

    // Travel 4 minutes forward (configured timeout is 3).
    $this->travel(4)->minutes();

    $this->actingAs($admin)->getJson("/api/v1/documents/{$this->sensitiveDocument->id}/preview-url")->assertForbidden();

    $log = VaultUnlockLog::query()->where('user_id', $admin->id)->where('company_id', $this->company->id)->firstOrFail();
    expect($log->isOpen())->toBeFalse();
    expect($log->lock_reason)->toBe(VaultLockReason::Timeout);
});

it('lets finance preview a sensitive document they uploaded themselves', function () {
    $admin = User::factory()->admin()->create();
    $finance = User::factory()->withRole('finance')->create();

    $this->actingAs($admin)->postJson('/api/v1/vault/pin', ['company_id' => $this->company->id, 'pin' => vaultPin()]);
    $this->actingAs($finance)->postJson('/api/v1/vault/unlock', ['company_id' => $this->company->id, 'pin' => vaultPin()]);

    $own = Document::factory()->verified()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->sensitiveDocument->document_template_id,
        'uploaded_by_user_id' => $finance->id,
        'file_path' => "documents/{$this->company->id}/own.pdf",
        'mime_type' => 'application/pdf',
    ]);

    $this->actingAs($finance)->getJson("/api/v1/documents/{$own->id}/preview-url")->assertOk();
});

it('blocks finance from previewing a sensitive document they did not upload', function () {
    $admin = User::factory()->admin()->create();
    $finance = User::factory()->withRole('finance')->create();

    $this->actingAs($admin)->postJson('/api/v1/vault/pin', ['company_id' => $this->company->id, 'pin' => vaultPin()]);
    $this->actingAs($finance)->postJson('/api/v1/vault/unlock', ['company_id' => $this->company->id, 'pin' => vaultPin()]);

    // $this->sensitiveDocument was uploaded by no finance user (null).
    $this->actingAs($finance)->getJson("/api/v1/documents/{$this->sensitiveDocument->id}/preview-url")->assertForbidden();
});

it('forbids staff from previewing a sensitive document even when another role unlocked', function () {
    $staff = User::factory()->withRole('staff')->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/vault/pin', ['company_id' => $this->company->id, 'pin' => vaultPin()]);
    $this->actingAs($admin)->postJson('/api/v1/vault/unlock', ['company_id' => $this->company->id, 'pin' => vaultPin()]);

    $this->actingAs($staff)->getJson("/api/v1/documents/{$this->sensitiveDocument->id}/preview-url")->assertForbidden();
});
