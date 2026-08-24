<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\SupportTicketController;
use Illuminate\Support\Facades\Route;

// One endpoint set, two consumers: company users (client-portal) see their
// own company's tickets via BelongsToCompany scoping; admin/staff see the
// whole queue and get assign/status powers through SupportTicketPolicy.
Route::prefix('support/tickets')->group(function () {
    Route::get('/', [SupportTicketController::class, 'index']);
    Route::post('/', [SupportTicketController::class, 'store']);
    Route::get('{ticket}', [SupportTicketController::class, 'show']);
    Route::post('{ticket}/messages', [SupportTicketController::class, 'reply']);
    Route::post('{ticket}/assign', [SupportTicketController::class, 'assign']);
    Route::post('{ticket}/status', [SupportTicketController::class, 'updateStatus']);
});
