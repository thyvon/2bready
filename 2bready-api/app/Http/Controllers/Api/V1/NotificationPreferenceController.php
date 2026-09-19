<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Notification\Enums\NotificationType;
use App\Domain\Notification\Models\NotificationPreference;
use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $preferences = NotificationPreference::where('user_id', $user->id)->get();

        // Merge with defaults so all types are always returned
        $result = [];
        foreach (NotificationType::cases() as $type) {
            $existing = $preferences->firstWhere('type', $type->value);
            $result[] = [
                'type' => $type->value,
                'label' => $type->label(),
                'email_enabled' => $existing?->email_enabled ?? true,
                'database_enabled' => $existing?->database_enabled ?? true,
            ];
        }

        return ApiResponse::success($result);
    }

    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*.type' => 'required|string|in:'.implode(',', array_map(fn ($e) => $e->value, NotificationType::cases())),
            'preferences.*.email_enabled' => 'required|boolean',
            'preferences.*.database_enabled' => 'required|boolean',
        ]);

        foreach ($validated['preferences'] as $pref) {
            NotificationPreference::updateOrCreate(
                ['user_id' => $user->id, 'type' => $pref['type']],
                [
                    'email_enabled' => $pref['email_enabled'],
                    'database_enabled' => $pref['database_enabled'],
                ],
            );
        }

        return ApiResponse::success($this->getFormattedPreferences($user));
    }

    /** @return array<int, array<string, mixed>> */
    private function getFormattedPreferences(User $user): array
    {
        $preferences = NotificationPreference::where('user_id', $user->id)->get();

        $result = [];
        foreach (NotificationType::cases() as $type) {
            $existing = $preferences->firstWhere('type', $type->value);
            $result[] = [
                'type' => $type->value,
                'label' => $type->label(),
                'email_enabled' => $existing?->email_enabled ?? true,
                'database_enabled' => $existing?->database_enabled ?? true,
            ];
        }

        return $result;
    }
}
