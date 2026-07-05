<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ScopeToCompany
{
    public function handle(Request $request, Closure $next): Response
    {
        // The BelongsToCompany global scope handles actual query filtering.
        // This middleware validates that the authenticated user has an active company
        // selected (they may belong to several — see User::companies() — but every
        // request still needs exactly one active one to scope against).
        if ($request->user() && ! $request->user()->current_company_id) {
            return response()->json(['message' => 'No company context found for this user.'], 403);
        }

        return $next($request);
    }
}
