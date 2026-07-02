<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

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
            \App\Http\Middleware\ForceJsonResponse::class,
        ]);

        $middleware->alias([
            'company.active' => \App\Http\Middleware\EnsureCompanyIsActive::class,
            'company.scope'  => \App\Http\Middleware\ScopeToCompany::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\App\Exceptions\DomainException $e) {
            return \App\Support\ApiResponse::error($e->getMessage(), [], 422);
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e) {
            return \App\Support\ApiResponse::error('Unauthenticated.', [], 401);
        });

        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \App\Support\ApiResponse::error('This action is unauthorized.', [], 403);
        });

        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return \App\Support\ApiResponse::error('Resource not found.', [], 404);
        });

        $exceptions->render(function (\Illuminate\Validation\ValidationException $e) {
            return \App\Support\ApiResponse::error($e->getMessage(), $e->errors(), 422);
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException $e) {
            return \App\Support\ApiResponse::error('Too many requests. Please slow down.', [], 429);
        });
    })->create();
