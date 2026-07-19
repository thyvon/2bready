<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Shared\Services\GoogleOAuthSettingService;
use App\Domain\User\Actions\HandleGoogleCallbackAction;
use App\Domain\User\Actions\IssueAuthTokenAction;
use App\Domain\User\Exceptions\GoogleAuthRejectedException;
use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

class GoogleAuthController extends Controller
{
    private const EXCHANGE_CACHE_PREFIX = 'google_auth_exchange:';

    // Public, unauthenticated — both login pages call this before rendering
    // the "Sign in with Google" button at all.
    public function status(GoogleOAuthSettingService $settings): JsonResponse
    {
        return ApiResponse::success(['enabled' => $settings->isFullyConfigured()]);
    }

    public function redirect(Request $request, GoogleOAuthSettingService $settings): RedirectResponse
    {
        abort_unless($settings->isFullyConfigured(), 404);

        $portal = $this->validatePortal($request);

        return $this->provider($settings, $portal)->redirect();
    }

    public function callback(
        Request $request,
        GoogleOAuthSettingService $settings,
        HandleGoogleCallbackAction $action,
    ): RedirectResponse {
        abort_unless($settings->isFullyConfigured(), 404);

        $portal = $this->validatePortal($request);
        $frontendBase = $portal === 'admin'
            ? config('app.admin_frontend_url', config('app.frontend_url'))
            : config('app.frontend_url');

        try {
            $googleUser = $this->provider($settings, $portal)->user();
            $user = $action->execute($googleUser, $portal);
        } catch (GoogleAuthRejectedException $e) {
            return redirect()->away($frontendBase.'/login?google_error='.rawurlencode($e->getMessage()));
        }

        // Hand off via a short-lived, one-time exchange code rather than putting
        // a real bearer token in a URL (browser history, referrer headers, server
        // access logs would all see it otherwise) — the frontend immediately
        // exchanges this for the real token via POST /auth/google/exchange.
        $code = Str::random(64);
        Cache::put(self::EXCHANGE_CACHE_PREFIX.$code, $user->id, now()->addSeconds(60));

        return redirect()->away($frontendBase.'/login/google-callback?code='.$code);
    }

    public function exchange(Request $request, IssueAuthTokenAction $issueToken): JsonResponse
    {
        $code = (string) $request->input('code');
        $key = self::EXCHANGE_CACHE_PREFIX.$code;
        $userId = Cache::get($key);
        Cache::forget($key);

        if (! $userId) {
            return ApiResponse::error('This sign-in link has expired. Please try again.', [], 403);
        }

        $user = User::query()->findOrFail($userId);

        return ApiResponse::success($issueToken->execute($user), [], 200);
    }

    private function validatePortal(Request $request): string
    {
        $portal = (string) $request->query('portal', 'client');
        abort_unless(in_array($portal, ['admin', 'client'], true), 422, 'Invalid portal.');

        return $portal;
    }

    private function provider(GoogleOAuthSettingService $settings, string $portal): GoogleProvider
    {
        $redirectUri = url("/api/v1/auth/google/callback?portal={$portal}");

        /** @var GoogleProvider $provider */
        $provider = Socialite::buildProvider(GoogleProvider::class, [
            'client_id' => $settings->clientId(),
            'client_secret' => $settings->clientSecret(),
            'redirect' => $redirectUri,
        ]);

        return $provider->stateless();
    }
}
