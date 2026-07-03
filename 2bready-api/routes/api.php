<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    require __DIR__.'/api/auth.php';

    Route::middleware(['auth:sanctum'])->group(function () {
        require __DIR__.'/api/company.php';
        require __DIR__.'/api/user.php';
        require __DIR__.'/api/package.php';
        require __DIR__.'/api/payment.php';
        require __DIR__.'/api/journey.php';
        require __DIR__.'/api/document.php';
        require __DIR__.'/api/audit.php';
        require __DIR__.'/api/data-room.php';
        require __DIR__.'/api/notification.php';
        require __DIR__.'/api/support.php';
        require __DIR__.'/api/sop.php';
        require __DIR__.'/api/report.php';
        require __DIR__.'/api/audit-log.php';
        require __DIR__.'/api/settings.php';
    });
});
