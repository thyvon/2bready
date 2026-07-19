<?php

declare(strict_types=1);

namespace App\Domain\User\Models;

use App\Domain\Company\Models\Company;
use App\Domain\User\Enums\UserStatus;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\HasUlid;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property UserStatus $status
 * @property string|null $current_company_id
 * @property string $locale
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property bool|null $two_factor_required
 * @property string|null $google_id
 * @property bool $google_auth_enabled
 *
 * @use HasFactory<UserFactory>
 */
class User extends Authenticatable implements MustVerifyEmailContract
{
    /** @use HasFactory<UserFactory> */
    use Auditable, HasApiTokens, HasFactory, HasRoles, HasUlid, MustVerifyEmail, Notifiable;

    // Back-office roles admin-portal's User Management page can assign/see —
    // the single source of truth for that boundary (UserController,
    // StoreUserRequest, UpdateUserRequest, UpdateUserAction all reference this
    // instead of repeating the literal array). Never includes company_owner/
    // company_member: admin-portal never creates or manages those, and an
    // account holding both an internal role and company_owner (a real
    // production account does) must never have the company_owner side of it
    // touched by anything that only knows about this list — see
    // UpdateUserAction, which syncs roles scoped to this set specifically so
    // it can't accidentally strip a role outside it.
    public const INTERNAL_ROLES = ['admin', 'staff', 'finance', 'auditor'];

    /** @return Factory<User> */
    protected static function newFactory(): Factory
    {
        return UserFactory::new();
    }

    protected $fillable = [
        'name',
        'email',
        'password',
        'current_company_id',
        'status',
        'locale',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'two_factor_required',
        'email_verified_at',
        'google_id',
        'google_auth_enabled',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    // Default values for a brand-new (unsaved or just-created-but-not-refetched)
    // instance — without this, every User::create([...]) call site that doesn't
    // explicitly list these two columns leaves them genuinely absent from
    // $attributes (not just null), which throws under Model::shouldBeStrict()'s
    // missing-attribute check the moment UserResource reads them on that same
    // in-memory object (e.g. straight out of RegisterUserAction/
    // HandleGoogleCallbackAction, before any request re-fetches the row).
    protected $attributes = [
        'google_auth_enabled' => false,
        'two_factor_required' => null,
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_required' => 'boolean',
            'google_auth_enabled' => 'boolean',
            'password' => 'hashed',
            'status' => UserStatus::class,
        ];
    }

    public function hasTwoFactorEnabled(): bool
    {
        return ! is_null($this->two_factor_confirmed_at);
    }

    // 2FA is mandatory by default for every role that can reach admin-portal (a
    // password-only credential must never be enough to reach business data
    // there) — driven by the same portal.admin.access permission that gates
    // login itself, not a separately-maintained role list. An admin may
    // override this per user either direction via two_factor_required
    // (null = keep this default, true/false = force it regardless of role) —
    // see UpdateUserRequest.
    public function requiresTwoFactor(): bool
    {
        return $this->two_factor_required ?? $this->canAccessAdminPortal();
    }

    // Whether this account may authenticate into admin-portal vs client-portal
    // (see AuthController::login/adminLogin). Backed by the portal.admin.access /
    // portal.client.access permissions (RolePermissionSeeder), not a hardcoded
    // role array — a role can hold both, neither, or either independently, and
    // adding a new back-office or company-side role never requires touching this
    // file. Deliberately distinct from "isInternal"-style tenancy-bypass checks
    // (BelongsToCompany, CompanyPolicy, PaymentPolicy, SubscriptionPolicy), which
    // use their own, smaller admin/staff/finance set for a different concern
    // (does this account see across all companies) — auditors, for example, can
    // access admin-portal without that bypass.
    public function canAccessAdminPortal(): bool
    {
        return $this->can('portal.admin.access');
    }

    public function canAccessClientPortal(): bool
    {
        return $this->can('portal.client.access');
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    /**
     * All companies this user is a member of (owner or staff). See §0.7 of the
     * MVP proposal: one person can now own/belong to more than one company —
     * this replaces what used to be a single company_id column.
     *
     * @return BelongsToMany<Company, $this>
     */
    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_user');
    }

    /**
     * The company every tenant-scoped query resolves against right now — see
     * BelongsToCompany::resolveCurrentCompanyId(). Changed only via
     * SwitchActiveCompanyAction, which checks membership in companies() first.
     *
     * @return BelongsTo<Company, $this>
     */
    public function currentCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'current_company_id');
    }
}
