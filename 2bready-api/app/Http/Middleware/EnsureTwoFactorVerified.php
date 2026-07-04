<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks tokens issued during a pending TOTP flow (see AuthController::login()) from
 * reaching any business route. Those tokens only carry the 'totp-pending' ability, so a
 * fully-capable ('*') token is required here. Applied to every protected route group
 * except routes/api/auth.php's own auth:sanctum group (logout, me, totp/*), which pending
 * tokens must still be able to reach.
 */
class EnsureTwoFactorVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->currentAccessToken()?->cant('*')) {
            return response()->json(['message' => 'Two-factor authentication is required to access this resource.'], 403);
        }

        return $next($request);
    }
}
