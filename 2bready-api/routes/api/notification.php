<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\NotificationPreferenceController;
use Illuminate\Support\Facades\Route;

Route::get('notifications', [NotificationController::class, 'index']);
Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
Route::get('notification-preferences', [NotificationPreferenceController::class, 'index']);
Route::put('notification-preferences', [NotificationPreferenceController::class, 'update']);
