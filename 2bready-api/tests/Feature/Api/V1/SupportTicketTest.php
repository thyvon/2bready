<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Support\Models\SupportTicket;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Create ──────────────────────────────────────────────────────────────────

it('lets a company_owner open a ticket with its first message', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $response = $this->actingAs($owner)->postJson('/api/v1/support/tickets', [
        'category' => 'billing',
        'subject' => 'Wrong amount charged',
        'message' => 'I was charged twice this month.',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'open')
        ->assertJsonPath('data.category', 'billing');

    $ticket = SupportTicket::latest('id')->first();
    expect($ticket->messages)->toHaveCount(1)
        ->and($ticket->messages->first()->message)->toBe('I was charged twice this month.');
});

it('validates the create payload', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    $this->actingAs($owner)->postJson('/api/v1/support/tickets', [
        'category' => 'not-a-category',
        'subject' => '',
        'message' => '',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['category', 'subject', 'message']);
});

it('forbids internal roles from opening tickets', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/support/tickets', [
        'category' => 'general',
        'subject' => 'Admin question',
        'message' => 'Hello',
    ])->assertForbidden();
});

it('requires authentication to open a ticket', function () {
    $this->postJson('/api/v1/support/tickets', [
        'category' => 'general',
        'subject' => 'X',
        'message' => 'Y',
    ])->assertUnauthorized();
});

// ─── List / scoping ─────────────────────────────────────────────────────────

it('scopes the index to the company user own tickets', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    SupportTicket::factory()->count(2)->create(['company_id' => $company->id, 'created_by' => $owner->id]);
    SupportTicket::factory()->create(['company_id' => Company::factory()->create()->id]);

    // Company users never see other companies' rows — BelongsToCompany scope.
    $response = $this->actingAs($owner)->getJson('/api/v1/support/tickets');
    $response->assertOk();
    expect(collect($response->json('data')))->toHaveCount(2);
});

it('shows the whole queue for admin and only own company rows for owners', function () {
    $companyA = Company::factory()->create();
    $ownerA = User::factory()->companyOwner()->withCompany($companyA)->create();

    SupportTicket::factory()->create(['company_id' => $companyA->id, 'created_by' => $ownerA->id]);
    SupportTicket::factory()->create([
        'company_id' => Company::factory()->create()->id,
        'created_by' => User::factory()->create()->id,
    ]);

    $admin = User::factory()->admin()->create();
    expect(collect($this->actingAs($admin)->getJson('/api/v1/support/tickets')->json('data')))->toHaveCount(2);
    expect(collect($this->actingAs($ownerA)->getJson('/api/v1/support/tickets')->json('data')))->toHaveCount(1);
});

it('returns 404 for another company ticket via scoped binding', function () {
    $otherTicket = SupportTicket::factory()->create([
        'company_id' => Company::factory()->create()->id,
        'created_by' => User::factory()->create()->id,
    ]);
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();

    // 404, not 403: BelongsToCompany filters the route-model binding itself.
    $this->actingAs($owner)->getJson("/api/v1/support/tickets/{$otherTicket->id}")->assertNotFound();
});

it('requires authentication for the list endpoint', function () {
    $this->getJson('/api/v1/support/tickets')->assertUnauthorized();
});

// ─── Replies + status transitions ───────────────────────────────────────────

it('moves an open ticket to pending when the team replies', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $ticket = SupportTicket::factory()->create(['company_id' => $company->id, 'created_by' => $owner->id]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/v1/support/tickets/{$ticket->id}/messages", [
        'message' => 'Looking into this now.',
    ])->assertCreated();

    expect($ticket->fresh()->status->value)->toBe('pending')
        ->and($ticket->messages->count())->toBe(1);
});

it('reopens a pending or resolved ticket when the company replies', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    foreach (['pending', 'resolved'] as $status) {
        $ticket = SupportTicket::factory()->create([
            'company_id' => $company->id,
            'created_by' => $owner->id,
            'status' => $status,
        ]);

        $this->actingAs($owner)->postJson("/api/v1/support/tickets/{$ticket->id}/messages", [
            'message' => "Still stuck — reopening ($status).",
        ])->assertCreated();

        expect($ticket->fresh()->status->value)->toBe('open');
    }
});

it('forbids company replies on a closed ticket', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $ticket = SupportTicket::factory()->create([
        'company_id' => $company->id,
        'created_by' => $owner->id,
        'status' => 'closed',
    ]);

    $this->actingAs($owner)->postJson("/api/v1/support/tickets/{$ticket->id}/messages", [
        'message' => 'Reopening attempt.',
    ])->assertForbidden();
});

it('lets the team still reply on a closed ticket but keeps it closed', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $ticket = SupportTicket::factory()->create([
        'company_id' => $company->id,
        'created_by' => $owner->id,
        'status' => 'closed',
    ]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/v1/support/tickets/{$ticket->id}/messages", [
        'message' => 'Final note for the record.',
    ])->assertCreated();

    expect($ticket->fresh()->status->value)->toBe('closed');
});

// ─── Assign / resolve / close / reopen ──────────────────────────────────────

it('lets an admin assign a ticket and forbids the company from assigning', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $ticket = SupportTicket::factory()->create(['company_id' => $company->id, 'created_by' => $owner->id]);
    $staff = User::factory()->withRole('staff')->create();

    $this->actingAs(User::factory()->admin()->create())
        ->postJson("/api/v1/support/tickets/{$ticket->id}/assign", ['assigned_to' => $staff->id])
        ->assertOk()
        ->assertJsonPath('data.assigned_to', $staff->id);

    $this->actingAs($owner)->postJson("/api/v1/support/tickets/{$ticket->id}/assign", ['assigned_to' => null])
        ->assertForbidden();
});

it('resolves a ticket and lets the company close their own', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $ticket = SupportTicket::factory()->create(['company_id' => $company->id, 'created_by' => $owner->id]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/v1/support/tickets/{$ticket->id}/status", ['status' => 'resolved'])
        ->assertOk()
        ->assertJsonPath('data.status', 'resolved');

    $ownTicket = SupportTicket::factory()->create(['company_id' => $company->id, 'created_by' => $owner->id]);
    $this->actingAs($owner)->postJson("/api/v1/support/tickets/{$ownTicket->id}/status", ['status' => 'closed'])
        ->assertOk()
        ->assertJsonPath('data.status', 'closed');
});

it('blocks company status changes on closed tickets but lets admin reopen', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $ticket = SupportTicket::factory()->create([
        'company_id' => $company->id,
        'created_by' => $owner->id,
        'status' => 'closed',
    ]);

    // The policy itself bars companies from touching a closed ticket's
    // status — 403, not a validation error.
    $this->actingAs($owner)->postJson("/api/v1/support/tickets/{$ticket->id}/status", ['status' => 'resolved'])
        ->assertForbidden();

    $this->actingAs(User::factory()->admin()->create())
        ->postJson("/api/v1/support/tickets/{$ticket->id}/status", ['status' => 'open'])
        ->assertOk()
        ->assertJsonPath('data.status', 'open');
});
