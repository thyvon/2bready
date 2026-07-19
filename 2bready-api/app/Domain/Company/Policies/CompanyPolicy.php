<?php

declare(strict_types=1);

namespace App\Domain\Company\Policies;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;

class CompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('company.list');
    }

    public function view(User $user, Company $company): bool
    {
        return $user->can('company.view') && ($this->isInternal($user) || $this->isMember($user, $company));
    }

    public function create(User $user): bool
    {
        return $user->can('company.create');
    }

    /**
     * Self-service registration is deliberately independent of company.create
     * (which is an internal-staff permission for onboarding companies on a
     * client's behalf). A company_owner may register any number of companies
     * (§0.7 of the MVP proposal) — no longer capped at one.
     */
    public function registerOwn(User $user): bool
    {
        return $user->hasRole('company_owner');
    }

    /**
     * Switching which of the user's own companies is the active one — see
     * SwitchActiveCompanyAction. Also blocks switching into a suspended/inactive
     * company: without this, the switch would silently succeed and only the
     * *next* request would 403 (EnsureCompanyIsActive), which is a confusing
     * place for the user to first learn their company is suspended.
     */
    public function switchTo(User $user, Company $company): bool
    {
        return $this->isMember($user, $company) && $company->isActive();
    }

    public function update(User $user, Company $company): bool
    {
        return $user->can('company.edit') && ($this->isInternal($user) || $this->isMember($user, $company));
    }

    public function delete(User $user, Company $company): bool
    {
        return $user->can('company.delete') && $this->isInternal($user);
    }

    /** Membership, not just "currently active" — a user can view/edit/switch to any company they belong to. */
    private function isMember(User $user, Company $company): bool
    {
        return $user->companies()->where('companies.id', $company->id)->exists();
    }

    private function isInternal(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'staff', 'finance']);
    }
}
