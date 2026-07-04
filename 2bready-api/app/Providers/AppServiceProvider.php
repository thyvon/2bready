<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Company\Models\Company;
use App\Domain\Company\Policies\CompanyPolicy;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->register(RepositoryServiceProvider::class);

        if ($this->app->environment('local')) {
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);
        }
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
        JsonResource::withoutWrapping();

        Gate::policy(Company::class, CompanyPolicy::class);

        // Keyed by email+IP so an attacker can't route around the limit from multiple
        // IPs against a single account, nor mass-guess many accounts from one IP.
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip());
        });

        // Covers totp/setup, totp/confirm, totp/verify — keyed by the authenticated user
        // (all three require a token) so one account's 6-digit code can't be brute-forced.
        RateLimiter::for('totp', function (Request $request) {
            return Limit::perMinute(5)->by((string) $request->user()?->id ?: $request->ip());
        });

        // Point email verification links at the frontend (API-only backend has no web routes)
        VerifyEmail::createUrlUsing(function ($notifiable) {
            $hash = sha1($notifiable->getEmailForVerification());
            $expires = now()->addMinutes(60)->unix();

            return rtrim(config('app.frontend_url', config('app.url')), '/').
                "/verify-email/{$notifiable->getKey()}/{$hash}?expires={$expires}";
        });
    }
}
