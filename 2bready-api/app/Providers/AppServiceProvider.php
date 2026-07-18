<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\AuditLog\Listeners\RecordAuditLogListener;
use App\Domain\AuditLog\Models\AuditLog;
use App\Domain\AuditLog\Policies\AuditLogPolicy;
use App\Domain\Company\Models\Company;
use App\Domain\Company\Policies\CompanyPolicy;
use App\Domain\Document\Events\DocumentVerified;
use App\Domain\Document\Listeners\CompleteMilestoneOnDocumentVerified;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Policies\DocumentPolicy;
use App\Domain\Industry\Models\Industry;
use App\Domain\Industry\Policies\IndustryPolicy;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Policies\JourneyPolicy;
use App\Domain\Package\Models\Lead;
use App\Domain\Package\Models\Package;
use App\Domain\Package\Policies\LeadPolicy;
use App\Domain\Package\Policies\PackagePolicy;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Models\Subscription;
use App\Domain\Payment\Policies\PaymentPolicy;
use App\Domain\Payment\Policies\SubscriptionPolicy;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
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

        // TLS terminates upstream (Cloudflare Tunnel/aaPanel) — this container's nginx
        // only ever sees plain HTTP, so generated URLs (signed document preview links,
        // email verification, etc.) would default to http:// and get blocked as mixed
        // content on the https:// frontend without this.
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        Gate::policy(AuditLog::class, AuditLogPolicy::class);
        Gate::policy(Company::class, CompanyPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(Industry::class, IndustryPolicy::class);
        Gate::policy(Journey::class, JourneyPolicy::class);
        Gate::policy(Package::class, PackagePolicy::class);
        Gate::policy(Subscription::class, SubscriptionPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(Lead::class, LeadPolicy::class);

        Event::listen(DocumentVerified::class, CompleteMilestoneOnDocumentVerified::class);
        Event::listen(AuditableActionOccurred::class, RecordAuditLogListener::class);

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
