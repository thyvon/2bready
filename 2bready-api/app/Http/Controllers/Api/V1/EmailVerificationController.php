<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    // Public — the user isn't necessarily authenticated in this browser/session
    // when they click the emailed link. Identity is proven by the hash matching
    // this specific user's email (same scheme AppServiceProvider's
    // VerifyEmail::createUrlUsing generates), not by a bearer token. Matches the
    // already-built frontend contract (admin-portal's verify-email page, mirrored
    // by client-portal's): POST id/hash as path segments, expires in the body.
    public function verify(Request $request, User $user, string $hash): JsonResponse
    {
        $expires = (int) $request->input('expires', 0);

        if ($expires < now()->unix() || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return ApiResponse::error('This verification link is invalid or has expired.', [], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return ApiResponse::success(['message' => 'Email already verified.']);
        }

        $user->markEmailAsVerified();

        event(new AuditableActionOccurred(
            action: 'auth.email_verified',
            actorId: $user->id,
            actorEmail: $user->email,
        ));

        return ApiResponse::success(['message' => 'Email verified.']);
    }

    // Authenticated — resending only ever makes sense for the currently
    // logged-in (but unverified) account, same as the resend-banner UX every
    // app with this flow uses.
    public function resend(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return ApiResponse::success(['message' => 'Email already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return ApiResponse::success(['message' => 'Verification email sent.']);
    }
}
