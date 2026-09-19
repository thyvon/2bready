<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $perPage = min(50, max(5, (int) $request->input('per_page', 15)));

        $notifications = $user->notifications()
            ->latest('created_at')
            ->paginate($perPage);

        $unreadCount = $user->unreadNotifications()->count();

        return ApiResponse::success(
            $notifications->items(),
            [
                'pagination' => [
                    'total' => $notifications->total(),
                    'per_page' => $notifications->perPage(),
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                ],
                'unread_count' => $unreadCount,
            ],
        );
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $notification = $user->notifications()->where('id', $id)->first();

        if ($notification === null) {
            return ApiResponse::error('Notification not found.', [], 404);
        }

        if ($notification->read_at === null) {
            $notification->markAsRead();
        }

        return ApiResponse::success($notification->fresh());
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->unreadNotifications()->update(['read_at' => now()]);

        return ApiResponse::noContent();
    }
}
