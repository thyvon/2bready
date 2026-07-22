<?php

declare(strict_types=1);

use App\Domain\Company\Models\Company;
use App\Domain\Document\Jobs\SendDocumentExpiryRemindersJob;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Notification\Notifications\DocumentExpiringNotification;
use App\Domain\Shared\Services\PlatformSettingService;
use App\Domain\User\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->company = Company::factory()->create();
    $this->template = DocumentTemplate::factory()->create();
});

it('reminds a company about a document expiring within the window, once', function () {
    Notification::fake();

    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    $document = Document::factory()->expiringInDays(10)->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->template->id,
    ]);

    app(SendDocumentExpiryRemindersJob::class)->handle(app(PlatformSettingService::class));

    Notification::assertSentTo($owner, DocumentExpiringNotification::class);
    expect($document->fresh()->expiry_reminded_at)->not->toBeNull();

    // Second run: already reminded, so no duplicate.
    Notification::fake();
    app(SendDocumentExpiryRemindersJob::class)->handle(app(PlatformSettingService::class));
    Notification::assertNothingSent();
});

it('does not remind about documents outside the reminder window', function () {
    Notification::fake();

    User::factory()->companyOwner()->withCompany($this->company)->create();
    Document::factory()->expiringInDays(200)->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->template->id,
    ]);

    app(SendDocumentExpiryRemindersJob::class)->handle(app(PlatformSettingService::class));

    Notification::assertNothingSent();
});

it('does not remind about a document that has already expired', function () {
    Notification::fake();

    User::factory()->companyOwner()->withCompany($this->company)->create();
    Document::factory()->expired()->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->template->id,
    ]);

    app(SendDocumentExpiryRemindersJob::class)->handle(app(PlatformSettingService::class));

    Notification::assertNothingSent();
});

it('honours an admin-configured reminder window', function () {
    Notification::fake();
    app(PlatformSettingService::class)->set('document_expiry_reminder_days', 90, 'compliance');

    $owner = User::factory()->companyOwner()->withCompany($this->company)->create();
    Document::factory()->expiringInDays(60)->create([
        'company_id' => $this->company->id,
        'document_template_id' => $this->template->id,
    ]);

    app(SendDocumentExpiryRemindersJob::class)->handle(app(PlatformSettingService::class));

    Notification::assertSentTo($owner, DocumentExpiringNotification::class);
});
