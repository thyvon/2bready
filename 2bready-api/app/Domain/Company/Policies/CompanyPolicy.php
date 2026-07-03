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
        return $user->can('company.view') && ($this->isInternal($user) || $user->company_id === $company->id);
    }

    public function create(User $user): bool
    {
        return $user->can('company.create');
    }

    public function update(User $user, Company $company): bool
    {
        return $user->can('company.edit') && ($this->isInternal($user) || $user->company_id === $company->id);
    }

    public function delete(User $user, Company $company): bool
    {
        return $user->can('company.delete') && $this->isInternal($user);
    }

    private function isInternal(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'staff', 'finance']);
    }
}
