<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Audit\Events\AuditDecisionMade;
use App\Domain\Audit\Listeners\UpdateComplianceScoreListener;
use App\Domain\Audit\Models\Audit;
use App\Domain\Audit\Policies\AuditPolicy;
use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\AuditLog\Listeners\RecordAuditLogListener;
use App\Domain\AuditLog\Models\AuditLog;
use App\Domain\AuditLog\Policies\AuditLogPolicy;
use App\Domain\Company\Models\Company;
use App\Domain\Company\Policies\CompanyPolicy;
use App\Domain\Document\Events\DocumentExpired;
use App\Domain\Document\Events\DocumentVerified;
use App\Domain\Document\Listeners\CompleteMilestoneOnDocumentVerified;
use App\Domain\Document\Listeners\RevertMilestoneCompletionOnDocumentExpired;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Document\Policies\DocumentPolicy;
use App\Domain\Document\Policies\DocumentTemplatePolicy;
use App\Domain\Industry\Models\Industry;
use App\Domain\Industry\Policies\IndustryPolicy;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Policies\JourneyLevelPolicy;
use App\Domain\Journey\Policies\JourneyPolicy;
use App\Domain\Journey\Policies\JourneyTemplatePolicy;
use App\Domain\Journey\Policies\MilestonePolicy;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Marketplace\Policies\TpHirePolicy;
use App\Domain\Notification\Listeners\SendDocumentExpiredNotification;
use App\Domain\Package\Models\Lead;
use App\Domain\Package\Models\Package;
use App\Domain\Package\Policies\LeadPolicy;
use App\Domain\Package\Policies\PackagePolicy;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Models\Subscription;
use App\Domain\Payment\Policies\PaymentPolicy;
use App\Domain\Payment\Policies\SubscriptionPolicy;
use App\Domain\Shared\Services\MailSettingService;
use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopCompany;
use App\Domain\Sop\Models\SopSignoff;
use App\Domain\Sop\Policies\SopPolicy;
use App\Domain\Sop\Policies\SopSignoffPolicy;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\TpPartner\Policies\TpPartnerPolicy;
use App\Domain\TrustBadge\Listeners\IssueTrustBadgeListener;
use App\Domain\User\Models\User;
use App\Domain\User\Policies\UserPolicy;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Throwable;

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

        // Best-effort: this runs on every request AND every artisan command,
        // including the very first `migrate` on a fresh install before the
        // platform_settings table exists — swallow rather than crash boot()
        // if the DB isn't ready yet. A no-op until an admin actually saves
        // mail settings (see MailSettingService::applyRuntimeConfig()).
        try {
            $this->app->make(MailSettingService::class)->applyRuntimeConfig();
        } catch (Throwable $e) {
            Log::debug('Skipped applying DB-backed mail settings', ['error' => $e->getMessage()]);
        }

        Gate::policy(AuditLog::class, AuditLogPolicy::class);
        Gate::policy(Audit::class, AuditPolicy::class);
        Gate::policy(Company::class, CompanyPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(Industry::class, IndustryPolicy::class);
        Gate::policy(Journey::class, JourneyPolicy::class);
        Gate::policy(JourneyTemplate::class, JourneyTemplatePolicy::class);
        Gate::policy(JourneyLevel::class, JourneyLevelPolicy::class);
        Gate::policy(Milestone::class, MilestonePolicy::class);
        Gate::policy(DocumentTemplate::class, DocumentTemplatePolicy::class);
        Gate::policy(Package::class, PackagePolicy::class);
        Gate::policy(Subscription::class, SubscriptionPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Lead::class, LeadPolicy::class);
        Gate::policy(TpPartner::class, TpPartnerPolicy::class);
        Gate::policy(TpHire::class, TpHirePolicy::class);

        Gate::policy(Sop::class, SopPolicy::class);
        Gate::policy(SopCompany::class, SopPolicy::class);
        Gate::policy(SopSignoff::class, SopSignoffPolicy::class);

        // Short, stable aliases for Payment::payable() instead of storing a
        // fully-qualified class name that breaks if a model is ever renamed
        // or moved. Not enforceMorphMap() — this app has other morph
        // relations (e.g. Laravel's own notifications table via User's
        // Notifiable trait) that aren't part of this map and must keep
        // resolving by class name as before.
        Relation::morphMap([
            'subscription' => Subscription::class,
            'tp_hire' => TpHire::class,
        ]);

        Event::listen(DocumentVerified::class, CompleteMilestoneOnDocumentVerified::class);
        Event::listen(DocumentExpired::class, RevertMilestoneCompletionOnDocumentExpired::class);
        Event::listen(DocumentExpired::class, SendDocumentExpiredNotification::class);
        Event::listen(AuditDecisionMade::class, UpdateComplianceScoreListener::class);
        Event::listen(AuditDecisionMade::class, IssueTrustBadgeListener::class);
        Event::listen(AuditableActionOccurred::class, RecordAuditLogListener::class);
        // Fires on RegisterUserAction's event(new Registered($user)) — sends the
        // verification email via User's now-wired MustVerifyEmail trait. Internal
        // accounts (CreateInternalUserAction) and Google-linked accounts both stamp
        // email_verified_at at creation time, so this never re-sends to them
        // (hasVerifiedEmail() short-circuits it).
        Event::listen(Registered::class, SendEmailVerificationNotification::class);

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

        // Resend-verification-email — keyed by user, not IP, so it can't be used to
        // mail-bomb an arbitrary inbox from many IPs (the endpoint always resends to
        // the authenticated caller's own email, never an arbitrary address).
        RateLimiter::for('verification.resend', function (Request $request) {
            return Limit::perMinutes(5, 1)->by((string) $request->user()?->id ?: $request->ip());
        });

        // Smart Data Room PIN verification — no user id on this public
        // request, so keyed by token+IP (same compound-key idiom as
        // 'login') rather than IP alone, so a brute-force sweep across many
        // links from one IP is still capped per-link, not just globally.
        RateLimiter::for('data-room.pin', function (Request $request) {
            return Limit::perMinute(5)->by(((string) $request->route('token')).'|'.$request->ip());
        });

        // Point email verification links at the frontend (API-only backend has no web
        // routes) — client-portal's verify-email page reads id/hash/expires as query
        // params (matching admin-portal's own already-built equivalent page, which
        // this mirrors even though internal accounts never actually receive one —
        // CreateInternalUserAction never fires the Registered event).
        VerifyEmail::createUrlUsing(function ($notifiable) {
            $hash = sha1($notifiable->getEmailForVerification());
            $expires = now()->addMinutes(60)->unix();

            return rtrim(config('app.frontend_url', config('app.url')), '/').
                "/verify-email?id={$notifiable->getKey()}&hash={$hash}&expires={$expires}";
        });
    }
}
