<?php

declare(strict_types=1);

namespace App\Domain\Notification\Services;

use App\Domain\Notification\Enums\NotificationType;
use App\Domain\Notification\Models\NotificationPreference;
use App\Domain\User\Models\User;

class NotificationPreferenceService
{
    /**
     * Determine which channels a user should receive a notification on.
     *
     * @return list<string>
     */
    public function getChannels(User $user, NotificationType $type): array
    {
        $preference = NotificationPreference::where('user_id', $user->id)
            ->where('type', $type->value)
            ->first();

        $channels = [];

        if ($preference === null || $preference->database_enabled) {
            $channels[] = 'database';
        }

        if ($preference === null || $preference->email_enabled) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Seed default preferences for a user (all enabled).
     */
    public function seedDefaults(User $user): void
    {
        foreach (NotificationType::cases() as $type) {
            NotificationPreference::firstOrCreate([
                'user_id' => $user->id,
                'type' => $type->value,
            ], [
                'email_enabled' => true,
                'database_enabled' => true,
            ]);
        }
    }
}
