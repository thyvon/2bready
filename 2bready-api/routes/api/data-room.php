<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\DataRoomController;
use Illuminate\Support\Facades\Route;

// Singular per-company resource (no {id} — "my company's own link"), so
// authorization is route-level permission middleware rather than a Policy
// on a specific model instance (mirrors routes/api/settings.php's
// permission:settings.manage). company_member only gets data_room.view
// (see RolePermissionSeeder) — share/revoke are owner+admin/staff only.
Route::prefix('data-room')->group(function () {
    Route::get('/', [DataRoomController::class, 'show'])->middleware('permission:data_room.view');
    Route::post('/', [DataRoomController::class, 'store'])->middleware('permission:data_room.share');
    Route::delete('/', [DataRoomController::class, 'destroy'])->middleware('permission:data_room.share');
});
