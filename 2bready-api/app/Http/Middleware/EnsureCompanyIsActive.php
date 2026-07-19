<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->currentCompany && ! $user->currentCompany->isActive()) {
            event(new AuditableActionOccurred(
                action: 'company.access_rejected_suspended',
                actorId: $user->id,
                actorEmail: $user->email,
                metadata: ['company_id' => $user->currentCompany->id],
            ));

            return ApiResponse::error('Your company account is suspended or inactive.', [], 403);
        }

        return $next($request);
    }
}
