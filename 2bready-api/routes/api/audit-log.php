<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuditLogController;
use Illuminate\Support\Facades\Route;

Route::get('audit-logs', [AuditLogController::class, 'index']);
