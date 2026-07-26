<?php

declare(strict_types=1);

namespace App\Support\Concerns;

use App\Domain\Company\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * THE multi-tenancy boundary. Apply to every tenant-scoped model.
 *
 * Admin bypass is explicit via role check — never rely on a null company_id alone.
 * Internal roles (admin, staff, finance) bypass the scope so they see all tenants.
 * For admin Actions that need cross-tenant queries, use withoutGlobalScope('company').
 */
trait BelongsToCompany
{
    protected static function bootBelongsToCompany(): void
    {
        static::addGlobalScope('company', function (Builder $builder) {
            $user = auth()->user();

            // No authenticated user at all (e.g. a console/queue context) — leave
            // unscoped, matching the trait's pre-existing behavior for that case.
            if (! $user) {
                return;
            }

            if ($companyId = static::resolveCurrentCompanyId()) {
                $builder->where($builder->getModel()->getTable().'.company_id', $companyId);

                return;
            }

            // Authenticated, non-bypass (not admin/staff/finance), but no
            // current_company_id — e.g. a TP/auditor account, which is scoped by
            // TpHire assignment instead, never by company membership. Previously
            // this fell through with no `where` added at all, silently returning
            // every company's rows. Match nothing instead.
            if (! $user->hasAnyRole(['admin', 'staff', 'finance'])) {
                $builder->whereRaw('1 = 0');
            }
        });

        static::creating(function ($model) {
            if (empty($model->company_id) && $companyId = static::resolveCurrentCompanyId()) {
                $model->company_id = $companyId;
            }
        });
    }

    private static function resolveCurrentCompanyId(): ?string
    {
        $user = auth()->user();

        if (! $user) {
            return null;
        }

        // Internal roles see all companies — bypass must be explicit via role, not null company_id.
        if ($user->hasAnyRole(['admin', 'staff', 'finance'])) {
            return null;
        }

        return $user->current_company_id ?? null;
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
