<?php

declare(strict_types=1);

use App\Domain\Industry\Models\Industry;
use App\Domain\Package\Models\Package;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── List ────────────────────────────────────────────────────────────────────

it('lets a company_owner list only active packages', function () {
    Package::factory()->create(['name' => 'Active Plan', 'is_active' => true]);
    Package::factory()->inactive()->create(['name' => 'Retired Plan']);
    $owner = User::factory()->companyOwner()->create();

    $response = $this->actingAs($owner)->getJson('/api/v1/packages');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.name'))->toBe('Active Plan');
});

it('lets an admin list active and inactive packages', function () {
    Package::factory()->create();
    Package::factory()->inactive()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/v1/packages')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('requires authentication to list packages', function () {
    $this->getJson('/api/v1/packages')->assertUnauthorized();
});

it('scopes the public pricing list to an industry when requested', function () {
    $fnb = Industry::factory()->create(['code' => 'F&B']);
    $manufacturing = Industry::factory()->create(['code' => 'MANUFACTURING']);
    Package::factory()->create(['name' => 'F&B Plan', 'industry_id' => $fnb->id]);
    Package::factory()->create(['name' => 'Manufacturing Plan', 'industry_id' => $manufacturing->id]);
    Package::factory()->create(['name' => 'Generic Plan', 'industry_id' => null]);

    $response = $this->getJson('/api/v1/pricing?industry=F%26B');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.name'))->toBe('F&B Plan');
    expect($response->json('data.0.industry_code'))->toBe('F&B');
});

it('returns every active package when no industry is requested', function () {
    $fnb = Industry::factory()->create(['code' => 'F&B']);
    Package::factory()->create(['industry_id' => $fnb->id]);
    Package::factory()->create(['industry_id' => null]);

    $this->getJson('/api/v1/pricing')->assertOk()->assertJsonCount(2, 'data');
});

// ─── Create ──────────────────────────────────────────────────────────────────

it('lets an admin create a package', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/packages', [
        'name' => 'Growth',
        'price_cents' => 19900,
        'billing_period' => 'monthly',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Growth')
        ->assertJsonPath('data.price_cents', 19900);
});

it('lets an admin create a package scoped to an industry', function () {
    $industry = Industry::factory()->create(['code' => 'RETAIL']);
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/packages', [
        'name' => 'Retail Growth',
        'price_cents' => 19900,
        'industry_id' => $industry->id,
    ]);

    $response->assertCreated()->assertJsonPath('data.industry_id', $industry->id);
});

it('rejects a package with an unknown industry_id', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/packages', [
        'name' => 'Growth',
        'price_cents' => 19900,
        'industry_id' => 'not-a-real-id',
    ])->assertUnprocessable()->assertJsonValidationErrors(['industry_id']);
});

it('rejects package creation without required fields', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/packages', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'price_cents']);
});

it('forbids a company_owner from creating a package', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->postJson('/api/v1/packages', [
        'name' => 'Growth',
        'price_cents' => 19900,
    ])->assertForbidden();
});

// ─── Update ──────────────────────────────────────────────────────────────────

it('lets an admin update a package', function () {
    $package = Package::factory()->create(['price_cents' => 9900]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/packages/{$package->id}", [
        'price_cents' => 14900,
    ])->assertOk()->assertJsonPath('data.price_cents', 14900);
});

it('forbids a company_owner from updating a package', function () {
    $package = Package::factory()->create();
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->patchJson("/api/v1/packages/{$package->id}", [
        'price_cents' => 100,
    ])->assertForbidden();
});

// ─── Delete ──────────────────────────────────────────────────────────────────

it('lets an admin archive a package', function () {
    $package = Package::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->deleteJson("/api/v1/packages/{$package->id}")->assertNoContent();

    $this->assertSoftDeleted('packages', ['id' => $package->id]);
});

it('forbids a company_owner from deleting a package', function () {
    $package = Package::factory()->create();
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->deleteJson("/api/v1/packages/{$package->id}")->assertForbidden();
});
