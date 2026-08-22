<?php

declare(strict_types=1);

namespace App\Domain\Sop\Models;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\SopFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Standard Operating Procedure (SOP) — platform-wide template or company-specific.
 *
 * - Global SOP: company_id = null (platform-wide template authored by admin).
 * - Company-specific SOP: company_id set (custom SOP for that company, or an
 *   adoption of a global SOP with optional content overrides via sop_company).
 *
 * Only one SOP per (company_id, title, version) is allowed (unique index).
 * Only one active SOP per company is enforced at the application level.
 *
 * @use HasFactory<SopFactory>
 */
class Sop extends Model
{
    /** @use HasFactory<SopFactory> */
    use BelongsToCompany, HasFactory, HasUlid, SoftDeletes;

    protected $table = 'sops';

    protected static function newFactory(): SopFactory
    {
        return SopFactory::new();
    }

    /**
     * SOPs are not purely tenant-scoped: global templates have company_id = null
     * and are adopted by any company. The blanket BelongsToCompany scope would
     * hide global SOPs from company users entirely (404 on binding, missing from
     * lists), so route binding bypasses it — authorization is enforced by
     * SopPolicy on top of the controller's own scoping.
     */
    public function resolveRouteBindingQuery($query, $value, $field = null)
    {
        return $query->withoutGlobalScope('company')
            ->where($field ?? $this->getRouteKeyName(), $value);
    }

    protected $fillable = [
        'title',
        'version',
        'content_en',
        'content_kh',
        'effective_at',
        'is_active',
        'company_id',
        'created_by_user_id',
    ];

    protected $casts = [
        'effective_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /** Global SOP (platform-wide template) */
    /** @return Builder<Sop> */
    public function scopeGlobal(): Builder
    {
        return $this->whereNull('company_id');
    }

    /** Company-specific SOP (either custom or adopted)
     *
     * @param  Builder<Sop>  $query
     * @return Builder<Sop>
     */
    public function scopeForCompany(Builder $query, string $companyId): Builder
    {
        return $query->where('company_id', $companyId);
    }

    /** Active SOPs */
    /** @return Builder<Sop> */
    public function scopeActive(): Builder
    {
        return $this->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('effective_at')
                    ->orWhere('effective_at', '<=', now());
            });
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<User, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /** Companies that have adopted this global SOP (with optional overrides) */
    /** @return HasMany<SopCompany, $this> */
    public function adoptions(): HasMany
    {
        return $this->hasMany(SopCompany::class);
    }

    /** Employees assigned to read & acknowledge this SOP */
    /** @return HasMany<SopSignoff, $this> */
    public function signoffs(): HasMany
    {
        return $this->hasMany(SopSignoff::class);
    }

    /**
     * Resolves the content a given company should see: its adoption override
     * if one exists for the locale, else the SOP's own content. Khmer falls
     * back to English when no Khmer variant exists (content_kh is nullable).
     *
     * @param  string  $companyId  The adopting/owning company.
     * @param  'en'|'kh'  $locale
     * @return array{content: ?string, source: 'override'|'base'}
     */
    public function effectiveContentFor(string $companyId, string $locale = 'en'): array
    {
        if ($this->company_id === null) {
            // Global SOP: check for company-specific override
            $adoption = $this->adoptions()
                ->where('company_id', $companyId)
                ->first();

            if ($adoption) {
                $override = $locale === 'kh'
                    ? $adoption->override_content_kh
                    : $adoption->override_content_en;

                if ($override !== null && $override !== '') {
                    return ['content' => $override, 'source' => 'override'];
                }
            }
        }

        $base = $locale === 'kh' ? ($this->content_kh ?: $this->content_en) : $this->content_en;

        return ['content' => $base, 'source' => 'base'];
    }

    /** Checks if this SOP is active for a given company */
    public function isActiveFor(string $companyId): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->effective_at && $this->effective_at->isFuture()) {
            return false;
        }

        if ($this->company_id !== null) {
            return $this->company_id === $companyId;
        }

        // Global SOP is active for all companies unless they have their own active SOP
        return true;
    }
}
