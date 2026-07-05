<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->currentCompany && ! $user->currentCompany->isActive()) {
            return response()->json(['message' => 'Your company account is suspended or inactive.'], 403);
        }

        return $next($request);
    }
}
