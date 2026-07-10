<?php

declare(strict_types=1);

use App\Domain\Industry\Models\Industry;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Public list ─────────────────────────────────────────────────────────────

it('lets an anonymous visitor list active industries', function () {
    Industry::factory()->create(['code' => 'ACTIVE', 'is_active' => true]);
    Industry::factory()->inactive()->create(['code' => 'RETIRED']);

    $response = $this->getJson('/api/v1/industry-options');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.code'))->toBe('ACTIVE');
});

it('excludes description and is_active from the public industry list', function () {
    Industry::factory()->create(['code' => 'ACTIVE', 'description' => 'Internal notes']);

    $response = $this->getJson('/api/v1/industry-options');

    $response->assertOk()->assertJsonMissingPath('data.0.description')->assertJsonMissingPath('data.0.is_active');
});

// ─── List ────────────────────────────────────────────────────────────────────

it('lets a company_owner list only active industries', function () {
    Industry::factory()->create(['code' => 'ACTIVE', 'is_active' => true]);
    Industry::factory()->inactive()->create(['code' => 'RETIRED']);
    $owner = User::factory()->companyOwner()->create();

    $response = $this->actingAs($owner)->getJson('/api/v1/industries');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.code'))->toBe('ACTIVE');
});

it('lets an admin list active and inactive industries', function () {
    Industry::factory()->create();
    Industry::factory()->inactive()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/v1/industries')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('requires authentication to list industries', function () {
    $this->getJson('/api/v1/industries')->assertUnauthorized();
});

// ─── Create ──────────────────────────────────────────────────────────────────

it('lets an admin create an industry', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/industries', [
        'code' => 'AGRICULTURE',
        'name' => 'Agriculture',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.code', 'AGRICULTURE')
        ->assertJsonPath('data.name', 'Agriculture');
});

it('rejects industry creation without required fields', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/industries', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['code', 'name']);
});

it('rejects a duplicate industry code', function () {
    Industry::factory()->create(['code' => 'RETAIL']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/industries', [
        'code' => 'RETAIL',
        'name' => 'Retail & Trade',
    ])->assertUnprocessable()->assertJsonValidationErrors(['code']);
});

it('forbids a company_owner from creating an industry', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->postJson('/api/v1/industries', [
        'code' => 'AGRICULTURE',
        'name' => 'Agriculture',
    ])->assertForbidden();
});

// ─── Update ──────────────────────────────────────────────────────────────────

it('lets an admin update an industry', function () {
    $industry = Industry::factory()->create(['name' => 'Old Name']);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/industries/{$industry->id}", [
        'name' => 'New Name',
    ])->assertOk()->assertJsonPath('data.name', 'New Name');
});

it('forbids a company_owner from updating an industry', function () {
    $industry = Industry::factory()->create();
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->patchJson("/api/v1/industries/{$industry->id}", [
        'name' => 'New Name',
    ])->assertForbidden();
});

// ─── Delete ──────────────────────────────────────────────────────────────────

it('lets an admin archive an industry', function () {
    $industry = Industry::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->deleteJson("/api/v1/industries/{$industry->id}")->assertNoContent();

    $this->assertSoftDeleted('industries', ['id' => $industry->id]);
});

it('forbids a company_owner from deleting an industry', function () {
    $industry = Industry::factory()->create();
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->deleteJson("/api/v1/industries/{$industry->id}")->assertForbidden();
});
