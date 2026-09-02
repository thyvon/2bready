<?php

declare(strict_types=1);

use App\Domain\Industry\Models\Industry;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Package\Models\Package;
use App\Domain\User\Models\User;
use Database\Seeders\IndustrySeeder;
use Database\Seeders\JourneyTemplateSeeder;
use Database\Seeders\PackageSeeder;
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
        'monthly_price_cents' => 1990,
        'yearly_price_cents' => 19900,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Growth')
        ->assertJsonPath('data.prices.0.price_cents', 1990)
        ->assertJsonPath('data.prices.1.price_cents', 19900);

    // The create API materializes both billing-period rows (the grouping is a
    // view concern) — a subscription can still target the exact cadence.
    expect(Package::query()->where('name', 'Growth')->count())->toBe(2);
});

it('lets an admin create a package scoped to an industry', function () {
    $industry = Industry::factory()->create(['code' => 'RETAIL']);
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/packages', [
        'name' => 'Retail Growth',
        'monthly_price_cents' => 1990,
        'yearly_price_cents' => 19900,
        'industry_id' => $industry->id,
    ]);

    $response->assertCreated()->assertJsonPath('data.industry_id', $industry->id);
});

it('rejects a package with an unknown industry_id', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/packages', [
        'name' => 'Growth',
        'monthly_price_cents' => 1990,
        'yearly_price_cents' => 19900,
        'industry_id' => 'not-a-real-id',
    ])->assertUnprocessable()->assertJsonValidationErrors(['industry_id']);
});

it('rejects package creation without required fields', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/packages', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'monthly_price_cents', 'yearly_price_cents']);
});

it('forbids a company_owner from creating a package', function () {
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->postJson('/api/v1/packages', [
        'name' => 'Growth',
        'monthly_price_cents' => 1990,
        'yearly_price_cents' => 19900,
    ])->assertForbidden();
});

// ─── Update ──────────────────────────────────────────────────────────────────

it('lets an admin update a package', function () {
    $package = Package::factory()->create(['price_cents' => 9900]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/packages/{$package->id}", [
        'monthly_price_cents' => 1490,
    ])->assertOk()->assertJsonPath('data.prices.0.price_cents', 1490);
});

it('forbids a company_owner from updating a package', function () {
    $package = Package::factory()->create();
    $owner = User::factory()->companyOwner()->create();

    $this->actingAs($owner)->patchJson("/api/v1/packages/{$package->id}", [
        'monthly_price_cents' => 100,
    ])->assertForbidden();
});

it('materializes the missing monthly sibling when a monthly price is saved on a yearly-only package', function () {
    $level = JourneyLevel::factory()->create();
    $package = Package::factory()->create([
        'journey_level_id' => $level->id,
        'billing_period' => 'yearly',
        'price_cents' => 19900,
        'name' => 'Growth',
    ]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/packages/{$package->id}", [
        'monthly_price_cents' => 1990,
    ])->assertOk()->assertJsonPath('data.prices.0.price_cents', 1990);

    $monthly = Package::query()
        ->where('journey_level_id', $level->id)
        ->where('billing_period', 'monthly')
        ->first();
    expect($monthly)->not->toBeNull();
    expect($monthly->price_cents)->toBe(1990);
    expect($monthly->name)->toBe('Growth');
});

it('does not materialize a sibling when no price is submitted for the missing period', function () {
    $level = JourneyLevel::factory()->create();
    $package = Package::factory()->create([
        'journey_level_id' => $level->id,
        'billing_period' => 'yearly',
        'price_cents' => 19900,
    ]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/v1/packages/{$package->id}", [
        'name' => 'Renamed',
    ])->assertOk();

    expect(Package::query()->where('journey_level_id', $level->id)->count())->toBe(1);
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

// ─── Tier + journey level linkage ───────────────────────────────────────────

it('lets an admin create a package with a tier and journey level', function () {
    $fnb = Industry::factory()->create(['code' => 'F&B']);
    $template = JourneyTemplate::factory()->create(['country_code' => 'KH', 'industry_id' => $fnb->id]);
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L2']);
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/v1/packages', [
        'name' => 'Product Excellence',
        'monthly_price_cents' => 490,
        'yearly_price_cents' => 4900,
        'tier' => 'pro',
        'journey_level_id' => $level->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.tier', 'pro')
        ->assertJsonPath('data.journey_level_id', $level->id);
});

it('rejects a package with an unknown journey_level_id', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/packages', [
        'name' => 'Growth',
        'monthly_price_cents' => 1990,
        'yearly_price_cents' => 19900,
        'journey_level_id' => 'not-a-real-id',
    ])->assertUnprocessable()->assertJsonValidationErrors(['journey_level_id']);
});

it('rejects a package with an invalid tier', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson('/api/v1/packages', [
        'name' => 'Growth',
        'monthly_price_cents' => 1990,
        'yearly_price_cents' => 19900,
        'tier' => 'gold',
    ])->assertUnprocessable()->assertJsonValidationErrors(['tier']);
});

// ─── Journey levels (dropdown for the package form) ─────────────────────────

it('lets an admin list journey levels ordered by sort_order', function () {
    $admin = User::factory()->admin()->create();
    $template = JourneyTemplate::factory()->create();
    JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L2', 'sort_order' => 2]);
    JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L1', 'sort_order' => 1]);

    $response = $this->actingAs($admin)->getJson('/api/v1/journey-levels');

    $response->assertOk();
    // Order matters — this is what populates a select dropdown, so it must
    // come back in display order regardless of creation order.
    expect(collect($response->json('data'))->pluck('code')->all())->toBe(['L1', 'L2']);
});

it('lets finance list journey levels despite finance lacking journey.view', function () {
    $finance = User::factory()->withRole('finance')->create();

    $this->actingAs($finance)->getJson('/api/v1/journey-levels')->assertOk();
});

it('requires authentication to list journey levels', function () {
    $this->getJson('/api/v1/journey-levels')->assertUnauthorized();
});

it('nests the real journey level data in the public pricing list', function () {
    $fnb = Industry::factory()->create(['code' => 'F&B']);
    $template = JourneyTemplate::factory()->create(['country_code' => 'KH', 'industry_id' => $fnb->id]);
    $level = JourneyLevel::factory()->create(['journey_template_id' => $template->id, 'code' => 'L1', 'pathway_name' => 'The Launchpad']);
    Milestone::factory()->create(['journey_level_id' => $level->id, 'name' => 'Corporate & Legal', 'sort_order' => 1]);
    Package::factory()->create(['name' => 'Compliance Readiness', 'tier' => 'starter', 'journey_level_id' => $level->id]);

    $response = $this->getJson('/api/v1/pricing');

    $response->assertOk()
        ->assertJsonPath('data.0.tier', 'starter')
        ->assertJsonPath('data.0.journey_level_code', 'L1')
        ->assertJsonPath('data.0.pathway_name', 'The Launchpad')
        ->assertJsonPath('data.0.milestones.0.name', 'Corporate & Legal');
});

it('seeds a monthly and a yearly package for every level', function () {
    $this->seed(IndustrySeeder::class);
    $this->seed(JourneyTemplateSeeder::class);
    $this->seed(PackageSeeder::class);

    $levels = JourneyLevel::query()->whereHas('journeyTemplate', fn ($q) => $q->where('country_code', 'KH'))->get();

    foreach ($levels as $level) {
        $periods = Package::query()
            ->where('journey_level_id', $level->id)
            ->where('is_active', true)
            ->pluck('billing_period')
            ->map(fn ($p) => $p->value)
            ->sort()
            ->values()
            ->all();

        expect($periods)->toBe(['monthly', 'yearly'], "Level {$level->code} should have both a monthly and a yearly package");
    }
});

it('groups monthly and yearly prices under one package per level', function () {
    $this->seed(IndustrySeeder::class);
    $this->seed(JourneyTemplateSeeder::class);
    $this->seed(PackageSeeder::class);

    $response = $this->getJson('/api/v1/pricing');

    $response->assertOk();

    // One card per level, not one row per billing period.
    $data = $response->json('data');
    expect($data)->toHaveCount(JourneyLevel::query()->whereHas('journeyTemplate', fn ($q) => $q->where('country_code', 'KH'))->count());

    foreach ($data as $entry) {
        // The group's representative is the yearly row; each nested price
        // keeps its own id (so a visitor can subscribe to a specific cadence).
        expect($entry)->not->toHaveKey('billing_period');
        expect($entry['prices'])->toHaveCount(2);

        $periods = collect($entry['prices'])->pluck('billing_period')->sort()->values()->all();
        expect($periods)->toBe(['monthly', 'yearly']);

        $yearly = collect($entry['prices'])->firstWhere('billing_period', 'yearly');
        expect($yearly['id'])->toBe($entry['id']);
    }
});
