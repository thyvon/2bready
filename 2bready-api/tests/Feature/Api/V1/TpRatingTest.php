<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Marketplace\Models\TpRating;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/** A completed hire belonging to $company, plus its company_owner. */
function completedHireFor(Company $company, TpPartner $tpPartner): array
{
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $hire = TpHire::factory()->active()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'status' => 'completed',
    ]);

    return ['owner' => $owner, 'hire' => $hire];
}

// ─── Rate a completed hire ───────────────────────────────────────────────────

it('lets a company_owner rate a completed hire with a review', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    ['owner' => $owner, 'hire' => $hire] = completedHireFor($company, $tpPartner);

    $response = $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", [
        'rating' => 5,
        'review_text' => 'Thorough review, fast turnaround.',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.rating', 5)
        ->assertJsonPath('data.review_text', 'Thorough review, fast turnaround.')
        ->assertJsonPath('data.tp_hire_id', $hire->id)
        ->assertJsonPath('data.tp_partner_id', $tpPartner->id);

    $rating = TpRating::where('tp_hire_id', $hire->id)->first();
    expect($rating->rating)->toBe(5)
        ->and($rating->company_id)->toBe($company->id)
        ->and($rating->created_by_user_id)->toBe($owner->id);
});

it('rejects an out-of-range rating', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    ['owner' => $owner, 'hire' => $hire] = completedHireFor($company, $tpPartner);

    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 6])
        ->assertUnprocessable()->assertJsonValidationErrors(['rating']);

    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 0])
        ->assertUnprocessable()->assertJsonValidationErrors(['rating']);

    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 'five'])
        ->assertUnprocessable()->assertJsonValidationErrors(['rating']);

    expect(TpRating::count())->toBe(0);
});

it('rejects rating a hire that is not completed', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    foreach (['pending_payment', 'active', 'cancelled'] as $status) {
        $hire = TpHire::factory()->create([
            'company_id' => $company->id,
            'tp_partner_id' => $tpPartner->id,
            'status' => $status,
        ]);

        $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 4])
            ->assertUnprocessable();
    }

    expect(TpRating::count())->toBe(0);
});

it('allows only one rating per hire', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    ['owner' => $owner, 'hire' => $hire] = completedHireFor($company, $tpPartner);

    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 4])->assertCreated();

    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 2])
        ->assertUnprocessable();

    expect(TpRating::where('tp_hire_id', $hire->id)->count())->toBe(1);
});
it('hides another company\'s hire from rating (404, not 403)', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $otherCompany = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();

    $hire = TpHire::factory()->create([
        'company_id' => $otherCompany->id,
        'tp_partner_id' => $tpPartner->id,
        'status' => 'completed',
    ]);

    // Tenant isolation: scoped binding makes the other company's hire
    // invisible — 404, not 403.
    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 4])->assertNotFound();
});

it('forbids an admin from rating on a company\'s behalf', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->admin()->create();
    $tpPartner = TpPartner::factory()->create();
    $hire = TpHire::factory()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'status' => 'completed',
    ]);

    $this->actingAs($admin)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 4])->assertForbidden();
});

it('requires authentication to rate a hire', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    $hire = TpHire::factory()->create([
        'company_id' => $company->id,
        'tp_partner_id' => $tpPartner->id,
        'status' => 'completed',
    ]);

    $this->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 4])->assertUnauthorized();
});

// ─── Aggregates surfaced on the marketplace listing ─────────────────────────

it('surfaces average rating and count on the partner listing', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create(['name' => 'ADMIT Global Audit']);
    $owner = User::factory()->companyOwner()->withCompany($company)->create();

    foreach ([4, 5, 3] as $rating) {
        $hire = TpHire::factory()->create([
            'company_id' => $company->id,
            'tp_partner_id' => $tpPartner->id,
            'status' => 'completed',
        ]);
        $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => $rating])->assertCreated();
    }

    $response = $this->actingAs($owner)->getJson('/api/v1/tp-partners')->assertOk();

    $partner = collect($response->json('data'))->firstWhere('id', $tpPartner->id);
    // PHP JSON-serializes float 4.0 as 4 — the API returns 4 for whole
    // averages; the frontend formats with toFixed(1) for display.
    expect($partner['rating_avg'])->toBe(4)
        ->and($partner['rating_count'])->toBe(3);
});

it('includes the hire\'s own rating in the hire listing', function () {
    $company = Company::factory()->create();
    $tpPartner = TpPartner::factory()->create();
    ['owner' => $owner, 'hire' => $hire] = completedHireFor($company, $tpPartner);

    $this->actingAs($owner)->postJson("/api/v1/tp-hires/{$hire->id}/rate", ['rating' => 5, 'review_text' => 'Great work.'])
        ->assertCreated();

    $this->actingAs($owner)->getJson('/api/v1/tp-hires')
        ->assertOk()
        ->assertJsonPath('data.0.rating.rating', 5)
        ->assertJsonPath('data.0.rating.review_text', 'Great work.');
});
