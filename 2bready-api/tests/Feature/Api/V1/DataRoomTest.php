<?php

declare(strict_types=1);

use App\Domain\AuditLog\Models\AuditLog;
use App\Domain\Company\Models\Company;
use App\Domain\DataRoom\Models\DataRoomLink;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    Storage::fake('local');

    $this->company = Company::factory()->create();

    // One document per level (L1-L4), all verified except where noted —
    // only L3/L4 should ever be shareable via a data room link.
    $template = JourneyTemplate::factory()->create();
    $this->levels = collect(['L1', 'L2', 'L3', 'L4'])->mapWithKeys(function (string $code) use ($template) {
        $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => $code]);
        $milestone = Milestone::factory()->create(['journey_level_id' => $level->id]);
        $docTemplate = DocumentTemplate::factory()->create(['milestone_id' => $milestone->id, 'name' => "{$code} Certificate"]);
        $document = Document::factory()->verified()->create([
            'company_id' => $this->company->id,
            'document_template_id' => $docTemplate->id,
            'file_path' => "documents/{$this->company->id}/{$code}.pdf",
            'mime_type' => 'application/pdf',
        ]);

        return [$code => $document];
    });
});

// ─── Authenticated: create/show/revoke ──────────────────────────────────────

it('lets a company_owner generate a data room link', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $this->actingAs($owner)->postJson('/api/v1/data-room')
        ->assertCreated()
        ->assertJsonPath('data.status', 'active')
        ->assertJsonStructure(['data' => ['token', 'url', 'pin', 'expires_at', 'status']]);
});

it('generating a new link revokes the previous one', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $first = $this->actingAs($owner)->postJson('/api/v1/data-room')->json('data.token');
    $this->actingAs($owner)->postJson('/api/v1/data-room')->assertCreated();

    expect(DataRoomLink::query()->where('token', $first)->firstOrFail()->status()->value)->toBe('revoked');
});

it('lets a company_owner view their current link', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $this->actingAs($owner)->postJson('/api/v1/data-room');

    $this->actingAs($owner)->getJson('/api/v1/data-room')
        ->assertOk()
        ->assertJsonPath('data.status', 'active')
        ->assertJsonMissingPath('data.pin');
});

it('returns null when no link has been generated yet', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();

    $this->actingAs($owner)->getJson('/api/v1/data-room')->assertOk()->assertJsonPath('data', null);
});

it('lets a company_owner revoke their link', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $this->actingAs($owner)->postJson('/api/v1/data-room');

    $this->actingAs($owner)->deleteJson('/api/v1/data-room')
        ->assertOk()
        ->assertJsonPath('data.status', 'revoked');
});

it('forbids a company_member from creating or revoking a data room link', function () {
    $member = User::factory()->withRole('company_member')->withCompany($this->company)->create();

    $this->actingAs($member)->postJson('/api/v1/data-room')->assertForbidden();
    $this->actingAs($member)->deleteJson('/api/v1/data-room')->assertForbidden();
    // .view is still granted to members
    $this->actingAs($member)->getJson('/api/v1/data-room')->assertOk();
});

it('requires authentication for the authenticated data-room endpoints', function () {
    $this->postJson('/api/v1/data-room')->assertUnauthorized();
    $this->getJson('/api/v1/data-room')->assertUnauthorized();
    $this->deleteJson('/api/v1/data-room')->assertUnauthorized();
});

// ─── Public: verify ──────────────────────────────────────────────────────────

it('verifies a data room link with the correct PIN and returns only L3/L4 verified documents', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $created = $this->actingAs($owner)->postJson('/api/v1/data-room')->json('data');

    $response = $this->postJson("/api/v1/data-room/{$created['token']}/verify", ['pin' => $created['pin']])
        ->assertOk()
        ->assertJsonStructure(['data' => ['view_session', 'company_name', 'documents']]);

    $names = collect($response->json('data.documents'))->pluck('name');
    expect($names)->toHaveCount(2)->toContain('L3 Certificate', 'L4 Certificate');
});

it('rejects verification with the wrong PIN', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $created = $this->actingAs($owner)->postJson('/api/v1/data-room')->json('data');

    $this->postJson("/api/v1/data-room/{$created['token']}/verify", ['pin' => 'WRONGPIN'])
        ->assertForbidden();
});

it('rejects verification for an expired link', function () {
    $link = DataRoomLink::factory()->expired()->create(['company_id' => $this->company->id]);

    $this->postJson("/api/v1/data-room/{$link->token}/verify", ['pin' => 'TESTPIN1'])
        ->assertNotFound();
});

it('rejects verification for a revoked link', function () {
    $link = DataRoomLink::factory()->revoked()->create(['company_id' => $this->company->id]);

    $this->postJson("/api/v1/data-room/{$link->token}/verify", ['pin' => 'TESTPIN1'])
        ->assertNotFound();
});

it('rejects verification for an unknown token', function () {
    $this->postJson('/api/v1/data-room/does-not-exist/verify', ['pin' => 'TESTPIN1'])
        ->assertNotFound();
});

it('throttles repeated PIN attempts for the same link', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $created = $this->actingAs($owner)->postJson('/api/v1/data-room')->json('data');

    for ($i = 0; $i < 5; $i++) {
        $this->postJson("/api/v1/data-room/{$created['token']}/verify", ['pin' => 'WRONGPIN'])
            ->assertForbidden();
    }

    $this->postJson("/api/v1/data-room/{$created['token']}/verify", ['pin' => 'WRONGPIN'])
        ->assertStatus(429);
});

it('never leaks another company\'s documents through a data room link', function () {
    $otherCompany = Company::factory()->create();
    $otherOwner = User::factory()->companyOwner()->withCompany($otherCompany)->create();
    $otherLevel = JourneyLevel::factory()->create(['code' => 'L4']);
    $otherMilestone = Milestone::factory()->create(['journey_level_id' => $otherLevel->id]);
    $otherTemplate = DocumentTemplate::factory()->create(['milestone_id' => $otherMilestone->id, 'name' => 'Other Co Secret']);
    Document::factory()->verified()->create(['company_id' => $otherCompany->id, 'document_template_id' => $otherTemplate->id]);

    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $created = $this->actingAs($owner)->postJson('/api/v1/data-room')->json('data');

    $response = $this->postJson("/api/v1/data-room/{$created['token']}/verify", ['pin' => $created['pin']])->assertOk();

    expect(collect($response->json('data.documents'))->pluck('name'))->not->toContain('Other Co Secret');
});

// ─── Public: preview-url ─────────────────────────────────────────────────────

it('lets a verified viewer get a signed preview url for a shared document', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $created = $this->actingAs($owner)->postJson('/api/v1/data-room')->json('data');
    $verified = $this->postJson("/api/v1/data-room/{$created['token']}/verify", ['pin' => $created['pin']])->json('data');
    $viewSession = $verified['view_session'];
    $l4Doc = $this->levels['L4'];

    $response = $this->getJson("/api/v1/data-room/{$created['token']}/documents/{$l4Doc->id}/preview-url?view_session={$viewSession}")
        ->assertOk();

    expect($response->json('data.url'))->toContain($l4Doc->file_path)->toContain('expir');
});

it('forbids a preview-url request for a document outside the shared L3/L4 set', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $created = $this->actingAs($owner)->postJson('/api/v1/data-room')->json('data');
    $verified = $this->postJson("/api/v1/data-room/{$created['token']}/verify", ['pin' => $created['pin']])->json('data');
    $l1Doc = $this->levels['L1'];

    $this->getJson("/api/v1/data-room/{$created['token']}/documents/{$l1Doc->id}/preview-url?view_session={$verified['view_session']}")
        ->assertNotFound();
});

it('forbids a preview-url request with an invalid view_session', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $created = $this->actingAs($owner)->postJson('/api/v1/data-room')->json('data');
    $l4Doc = $this->levels['L4'];

    $this->getJson("/api/v1/data-room/{$created['token']}/documents/{$l4Doc->id}/preview-url?view_session=bogus")
        ->assertForbidden();
});

// ─── Audit log ───────────────────────────────────────────────────────────────

it('records audit log rows for created, accessed (granted/denied), and revoked', function () {
    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $created = $this->actingAs($owner)->postJson('/api/v1/data-room')->json('data');

    $this->postJson("/api/v1/data-room/{$created['token']}/verify", ['pin' => 'WRONGPIN']);
    $this->postJson("/api/v1/data-room/{$created['token']}/verify", ['pin' => $created['pin']]);
    $this->actingAs($owner)->deleteJson('/api/v1/data-room');

    $actions = AuditLog::query()->where('company_id', $this->company->id)->pluck('action');

    expect($actions)->toContain('data_room_link_created', 'data_room_accessed', 'data_room_link_revoked');

    $denied = AuditLog::query()->where('action', 'data_room_accessed')->where('metadata->granted', false)->count();
    $granted = AuditLog::query()->where('action', 'data_room_accessed')->where('metadata->granted', true)->count();
    expect($denied)->toBe(1)->and($granted)->toBe(1);
});
