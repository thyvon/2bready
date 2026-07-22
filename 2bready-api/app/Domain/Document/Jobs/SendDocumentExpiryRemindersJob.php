<?php

declare(strict_types=1);

namespace App\Domain\Document\Jobs;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Enums\DocumentStatus;
use App\Domain\Document\Models\Document;
use App\Domain\Notification\Notifications\DocumentExpiringNotification;
use App\Domain\Shared\Services\PlatformSettingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Scheduled daily (routes/console.php), right after ExpireOverdueDocumentsJob
 * — so a document that expired overnight isn't also sent a "will expire"
 * reminder the same run. Warns companies about verified documents that will
 * expire within the reminder window, before they lapse.
 *
 * The window length is admin-tunable (platform_settings
 * 'document_expiry_reminder_days'), not a hardcoded literal. Each document is
 * reminded once (expiry_reminded_at guards re-sends), so a daily run doesn't
 * spam a company every day of the window.
 */
class SendDocumentExpiryRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(PlatformSettingService $settings): void
    {
        $reminderDays = (int) $settings->get('document_expiry_reminder_days', 30);
        $threshold = now()->addDays($reminderDays);

        // Cross-tenant on purpose: this is a platform maintenance job with no
        // acting user, so BelongsToCompany's scope must not silently narrow
        // it to one company (mirrors ExpireOverdueDocumentsAction, which
        // relies on the same no-authenticated-user = no scope behaviour).
        Document::query()
            ->where('status', DocumentStatus::Verified)
            ->whereNotNull('expires_at')
            ->whereNull('expiry_reminded_at')
            ->where('expires_at', '<=', $threshold)
            ->where('expires_at', '>', now())
            ->with(['company.users', 'documentTemplate'])
            ->chunkById(200, function ($documents) {
                foreach ($documents as $document) {
                    /** @var Company|null $company */
                    $company = $document->company;

                    if ($company !== null) {
                        foreach ($company->users as $user) {
                            $user->notify(DocumentExpiringNotification::forDocument($document));
                        }
                    }

                    // Stamped even when a company has no users, so the row
                    // isn't re-scanned every run for nothing.
                    $document->update(['expiry_reminded_at' => now()]);
                }
            });
    }
}
