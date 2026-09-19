<?php

declare(strict_types=1);

use App\Domain\Audit\Events\AuditDecisionMade;
use App\Domain\Audit\Models\Audit;
use App\Domain\Company\Models\Company;
use App\Domain\Document\Events\DocumentExpired;
use App\Domain\Document\Events\DocumentVerified;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Notification\Listeners\SendAuditApprovedNotification;
use App\Domain\Notification\Listeners\SendDocumentExpiredNotification;
use App\Domain\Notification\Listeners\SendDocumentVerifiedNotification;
use App\Domain\Notification\Listeners\SendPaymentConfirmedNotification;
use App\Domain\Notification\Listeners\SendPaymentRejectedNotification;
use App\Domain\Notification\Listeners\SendSubscriptionCancelledNotification;
use App\Domain\Notification\Notifications\AuditApprovedNotification;
use App\Domain\Notification\Notifications\DocumentExpiredNotification;
use App\Domain\Notification\Notifications\DocumentVerifiedNotification;
use App\Domain\Notification\Notifications\PaymentConfirmedNotification;
use App\Domain\Notification\Notifications\PaymentRejectedNotification;
use App\Domain\Notification\Notifications\SubscriptionCancelledNotification;
use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Package\Models\Package;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Events\PaymentConfirmed;
use App\Domain\Payment\Events\PaymentRejected;
use App\Domain\Payment\Events\SubscriptionCancelled;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Models\Subscription;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

// ─── Payment Confirmed ─────────────────────────────────────────────────────

it('sends payment confirmed notification to company users', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $user = User::factory()->withRole('company_member')->withCompany($company)->create();
    $package = Package::factory()->create(['name' => 'L1 Growth', 'billing_period' => BillingPeriod::Monthly]);
    $subscription = Subscription::factory()->create([
        'company_id' => $company->id,
        'package_id' => $package->id,
        'status' => 'active',
    ]);
    $payment = Payment::factory()->create([
        'company_id' => $company->id,
        'payable_type' => Subscription::class,
        'payable_id' => $subscription->id,
        'amount_cents' => 1990,
        'currency' => 'USD',
        'status' => PaymentStatus::Confirmed,
    ]);

    $listener = new SendPaymentConfirmedNotification;
    $listener->handle(new PaymentConfirmed($payment));

    Notification::assertSentTo(
        $user,
        PaymentConfirmedNotification::class,
    );
});

// ─── Payment Rejected ──────────────────────────────────────────────────────

it('sends payment rejected notification to company users', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $user = User::factory()->withRole('company_member')->withCompany($company)->create();
    $package = Package::factory()->create(['name' => 'L2 Pro']);
    $subscription = Subscription::factory()->create([
        'company_id' => $company->id,
        'package_id' => $package->id,
    ]);
    $payment = Payment::factory()->create([
        'company_id' => $company->id,
        'payable_type' => Subscription::class,
        'payable_id' => $subscription->id,
        'amount_cents' => 4990,
        'currency' => 'USD',
        'status' => PaymentStatus::Rejected,
    ]);

    $listener = new SendPaymentRejectedNotification;
    $listener->handle(new PaymentRejected($payment));

    Notification::assertSentTo(
        $user,
        PaymentRejectedNotification::class,
    );
});

// ─── Document Verified ─────────────────────────────────────────────────────

it('sends document verified notification to company users', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $user = User::factory()->withRole('company_member')->withCompany($company)->create();
    $template = DocumentTemplate::factory()->create(['name' => 'Business License']);
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
        'status' => 'verified',
    ]);

    $listener = new SendDocumentVerifiedNotification;
    $listener->handle(new DocumentVerified($document));

    Notification::assertSentTo(
        $user,
        DocumentVerifiedNotification::class,
    );
});

// ─── Document Expired ──────────────────────────────────────────────────────

it('sends document expired notification to company users', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $user = User::factory()->withRole('company_member')->withCompany($company)->create();
    $template = DocumentTemplate::factory()->create(['name' => 'Tax Filing']);
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'document_template_id' => $template->id,
    ]);

    $listener = new SendDocumentExpiredNotification;
    $listener->handle(new DocumentExpired($document));

    Notification::assertSentTo(
        $user,
        DocumentExpiredNotification::class,
    );
});

// ─── Audit Approved ────────────────────────────────────────────────────────

it('sends audit approved notification to company users', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $user = User::factory()->withRole('company_member')->withCompany($company)->create();
    $admin = User::factory()->admin()->create();

    // Build a minimal audit-like object — the notification only reads
    // journey_level and the reviewer name, no need for full DB row.
    $audit = new Audit([
        'company_id' => $company->id,
        'journey_level' => 'L1',
    ]);

    $listener = new SendAuditApprovedNotification;
    $listener->handle(new AuditDecisionMade($audit, $admin));

    Notification::assertSentTo(
        $user,
        AuditApprovedNotification::class,
    );
});

// ─── Subscription Cancelled ────────────────────────────────────────────────

it('sends subscription cancelled notification to company users', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $user = User::factory()->withRole('company_member')->withCompany($company)->create();
    $package = Package::factory()->create(['name' => 'L3 Enterprise']);
    $subscription = Subscription::factory()->create([
        'company_id' => $company->id,
        'package_id' => $package->id,
        'status' => 'cancelled',
    ]);

    $listener = new SendSubscriptionCancelledNotification;
    $listener->handle(new SubscriptionCancelled($subscription));

    Notification::assertSentTo(
        $user,
        SubscriptionCancelledNotification::class,
    );
});
