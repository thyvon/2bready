<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Company\Models\Company;
use App\Domain\Company\Policies\CompanyPolicy;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
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

        // Point email verification links at the frontend (API-only backend has no web routes)
        VerifyEmail::createUrlUsing(function ($notifiable) {
            $hash = sha1($notifiable->getEmailForVerification());
            $expires = now()->addMinutes(60)->unix();

            return rtrim(config('app.frontend_url', config('app.url')), '/').
                "/verify-email/{$notifiable->getKey()}/{$hash}?expires={$expires}";
        });
    }
}
