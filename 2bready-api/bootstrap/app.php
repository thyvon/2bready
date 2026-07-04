<?php

declare(strict_types=1);

use App\Exceptions\DomainException;
use App\Http\Middleware\EnsureCompanyIsActive;
use App\Http\Middleware\EnsureTwoFactorVerified;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\ScopeToCompany;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        apiPrefix: 'api',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        $middleware->alias([
            'company.active' => EnsureCompanyIsActive::class,
            'company.scope' => ScopeToCompany::class,
            'totp.verified' => EnsureTwoFactorVerified::class,
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (DomainException $e) {
            return ApiResponse::error($e->getMessage(), [], 422);
        });

        $exceptions->render(function (AuthenticationException $e) {
            return ApiResponse::error('Unauthenticated.', [], 401);
        });

        $exceptions->render(function (AuthorizationException $e) {
            return ApiResponse::error('This action is unauthorized.', [], 403);
        });

        $exceptions->render(function (ModelNotFoundException $e) {
            return ApiResponse::error('Resource not found.', [], 404);
        });

        $exceptions->render(function (ValidationException $e) {
            return ApiResponse::error($e->getMessage(), $e->errors(), 422);
        });

        $exceptions->render(function (TooManyRequestsHttpException $e) {
            return ApiResponse::error('Too many requests. Please slow down.', [], 429);
        });
    })->create();
