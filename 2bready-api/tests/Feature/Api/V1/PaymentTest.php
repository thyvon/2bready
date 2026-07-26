<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Package\Models\Package;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Models\Subscription;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Subscribe ───────────────────────────────────────────────────────────────

it('lets a company_owner subscribe their company to a package via bank transfer', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $package = Package::factory()->create(['price_cents' => 19900]);

    $response = $this->actingAs($owner)->postJson('/api/v1/subscriptions', [
        'package_id' => $package->id,
        'method' => 'manual_bank_transfer',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.subscription.status', 'pending')
        ->assertJsonPath('data.payment.status', 'pending')
        ->assertJsonPath('data.payment.amount_cents', 19900)
        ->assertJsonStructure(['data' => ['gateway_data' => ['bank_name', 'account_number', 'reference']]]);

    expect(Subscription::where('company_id', $company->id)->count())->toBe(1);
});

it('lets a company_owner subscribe via the fake stripe gateway', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $package = Package::factory()->create();

    $this->actingAs($owner)->postJson('/api/v1/subscriptions', [
        'package_id' => $package->id,
        'method' => 'stripe',
    ])->assertCreated()
        ->assertJsonPath('data.gateway_data.stub', true)
        ->assertJsonStructure(['data' => ['gateway_data' => ['client_secret']]]);
});

it('forbids subscribing to an inactive package', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $package = Package::factory()->inactive()->create();

    $this->actingAs($owner)->postJson('/api/v1/subscriptions', [
        'package_id' => $package->id,
        'method' => 'manual_bank_transfer',
    ])->assertNotFound();
});

it('forbids a company_owner without a company from subscribing', function () {
    $owner = User::factory()->companyOwner()->create();
    $package = Package::factory()->create();

    $this->actingAs($owner)->postJson('/api/v1/subscriptions', [
        'package_id' => $package->id,
        'method' => 'manual_bank_transfer',
    ])->assertForbidden();
});

it('forbids an admin from using the self-service subscribe endpoint', function () {
    $admin = User::factory()->admin()->create();
    $package = Package::factory()->create();

    $this->actingAs($admin)->postJson('/api/v1/subscriptions', [
        'package_id' => $package->id,
        'method' => 'manual_bank_transfer',
    ])->assertForbidden();
});

it('requires authentication to subscribe', function () {
    $package = Package::factory()->create();

    $this->postJson('/api/v1/subscriptions', [
        'package_id' => $package->id,
        'method' => 'manual_bank_transfer',
    ])->assertUnauthorized();
});

// ─── Submit manual payment ───────────────────────────────────────────────────

it('lets a company_owner mark their own manual payment as submitted', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $subscription = Subscription::factory()->create(['company_id' => $company->id]);
    $payment = Payment::factory()->create(['company_id' => $company->id, 'payable_type' => 'subscription', 'payable_id' => $subscription->id]);

    $this->actingAs($owner)->postJson("/api/v1/payments/{$payment->id}/submit")
        ->assertOk()
        ->assertJsonPath('data.status', 'awaiting_confirmation');

    expect($payment->fresh()->submitted_at)->not->toBeNull();
});

it('forbids submitting another company\'s payment', function () {
    $owner = User::factory()->companyOwner()->withCompany(Company::factory()->create())->create();
    $otherCompany = Company::factory()->create();
    $subscription = Subscription::factory()->create(['company_id' => $otherCompany->id]);
    $payment = Payment::factory()->create(['company_id' => $otherCompany->id, 'payable_type' => 'subscription', 'payable_id' => $subscription->id]);

    // 404, not 403: BelongsToCompany's global scope filters the route-model-binding
    // query itself to the acting user's own company, so another company's payment
    // doesn't exist as far as this request is concerned — it never reaches the policy.
    $this->actingAs($owner)->postJson("/api/v1/payments/{$payment->id}/submit")->assertNotFound();
});

// ─── Confirm / reject ────────────────────────────────────────────────────────

it('lets finance confirm a payment and activates the subscription', function () {
    $company = Company::factory()->create();
    $package = Package::factory()->create(['billing_period' => 'monthly']);
    $subscription = Subscription::factory()->create(['company_id' => $company->id, 'package_id' => $package->id]);
    $payment = Payment::factory()->create([
        'company_id' => $company->id,
        'payable_type' => 'subscription', 'payable_id' => $subscription->id,
        'status' => 'awaiting_confirmation',
    ]);
    $finance = User::factory()->withRole('finance')->create();

    $this->actingAs($finance)->postJson("/api/v1/payments/{$payment->id}/confirm")
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed');

    expect($subscription->fresh()->status->value)->toBe('active');
    expect($company->fresh()->active_subscription_id)->toBe($subscription->id);
});

it('forbids a company_owner from confirming their own payment', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $subscription = Subscription::factory()->create(['company_id' => $company->id]);
    $payment = Payment::factory()->create(['company_id' => $company->id, 'payable_type' => 'subscription', 'payable_id' => $subscription->id]);

    $this->actingAs($owner)->postJson("/api/v1/payments/{$payment->id}/confirm")->assertForbidden();
});

it('lets an admin reject a payment', function () {
    $company = Company::factory()->create();
    $subscription = Subscription::factory()->create(['company_id' => $company->id]);
    $payment = Payment::factory()->create(['company_id' => $company->id, 'payable_type' => 'subscription', 'payable_id' => $subscription->id]);
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->postJson("/api/v1/payments/{$payment->id}/reject")
        ->assertOk()
        ->assertJsonPath('data.status', 'rejected');
});

// ─── List ────────────────────────────────────────────────────────────────────

it('lets a company_owner list only their own payments', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->companyOwner()->withCompany($company)->create();
    $subscription = Subscription::factory()->create(['company_id' => $company->id]);
    Payment::factory()->create(['company_id' => $company->id, 'payable_type' => 'subscription', 'payable_id' => $subscription->id]);

    $otherCompany = Company::factory()->create();
    $otherSubscription = Subscription::factory()->create(['company_id' => $otherCompany->id]);
    Payment::factory()->create(['company_id' => $otherCompany->id, 'payable_type' => 'subscription', 'payable_id' => $otherSubscription->id]);

    $this->actingAs($owner)->getJson('/api/v1/payments')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});
