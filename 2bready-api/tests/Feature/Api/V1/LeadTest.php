<?php

declare(strict_types=1);

use App\Domain\Package\Models\Lead;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

it('captures a lead from an anonymous visitor with no authentication', function () {
    $response = $this->postJson('/api/v1/leads', [
        'name' => 'Jane Prospect',
        'email' => 'jane@example.com',
        'company_name' => 'Prospect Co',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Jane Prospect')
        ->assertJsonPath('data.source', 'paywall');

    expect(Lead::where('email', 'jane@example.com')->exists())->toBeTrue();
});

it('rejects lead capture without required fields', function () {
    $this->postJson('/api/v1/leads', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email']);
});

it('lets staff list captured leads', function () {
    Lead::factory()->count(2)->create();
    $staff = User::factory()->withRole('staff')->create();

    $this->actingAs($staff)->getJson('/api/v1/leads')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('forbids a company_owner from listing leads', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->getJson('/api/v1/leads')->assertForbidden();
});

it('requires authentication to list leads', function () {
    $this->getJson('/api/v1/leads')->assertUnauthorized();
});
