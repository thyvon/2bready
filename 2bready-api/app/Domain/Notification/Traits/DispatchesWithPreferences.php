<?php

declare(strict_types=1);

namespace App\Domain\Notification\Traits;

use App\Domain\Notification\Enums\NotificationType;
use App\Domain\Notification\Services\NotificationPreferenceService;
use App\Domain\User\Models\User;
use Illuminate\Notifications\Notification;

trait DispatchesWithPreferences
{
    /**
     * Send notification to user only on channels they have enabled.
     */
    protected function notifyWithPreferences(
        User $user,
        Notification $notification,
        NotificationType $type,
    ): void {
        /** @var NotificationPreferenceService $preferenceService */
        $preferenceService = app(NotificationPreferenceService::class);
        $channels = $preferenceService->getChannels($user, $type);

        if ($channels !== []) {
            $user->notify($notification, $channels);
        }
    }
}
