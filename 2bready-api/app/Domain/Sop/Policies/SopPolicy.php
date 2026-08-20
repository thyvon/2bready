<?php

declare(strict_types=1);

namespace App\Domain\Sop\Policies;

use App\Domain\Sop\Models\Sop;
use App\Domain\User\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SopPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any SOPs.
     * Admin/staff/finance can view all (global + company). Company users see their company's SOPs.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'staff', 'finance'])
            || $user->hasRole('company_owner')
            || $user->hasRole('company_member');
    }

    /**
     * Determine whether the user can view the SOP.
     * Global SOPs: admin/staff/finance + company users (via adoption).
     * Company SOPs: only users of that company + admin/staff/finance.
     */
    public function view(User $user, Sop $sop): bool
    {
        if ($user->hasAnyRole(['admin', 'staff', 'finance'])) {
            return true;
        }

        if ($user->hasAnyRole(['company_owner', 'company_member'])) {
            if ($sop->company_id === null) {
                // Global SOP: check if company has adopted it
                return $sop->adoptions()->where('company_id', $user->current_company_id)->exists();
            }

            return $sop->company_id === $user->current_company_id;
        }

        return false;
    }

    /**
     * Determine whether the user can create SOPs.
     * Admin/staff can create global or company SOPs.
     * Company owners can create company-specific SOPs for their company.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'staff'])
            || $user->hasRole('company_owner');
    }

    /**
     * Determine whether the user can update the SOP.
     * Global SOPs: admin/staff only.
     * Company SOPs: admin/staff + company owner of that company.
     */
    public function update(User $user, Sop $sop): bool
    {
        if ($user->hasAnyRole(['admin', 'staff'])) {
            return true;
        }

        if ($user->hasRole('company_owner') && $sop->company_id !== null) {
            return $sop->company_id === $user->current_company_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the SOP.
     * Global SOPs: admin only.
     * Company SOPs: admin + company owner of that company.
     */
    public function delete(User $user, Sop $sop): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('company_owner') && $sop->company_id !== null) {
            return $sop->company_id === $user->current_company_id;
        }

        return false;
    }

    /**
     * Determine whether the user can activate/deactivate the SOP.
     * Global SOPs: admin/staff only.
     * Company SOPs: admin/staff + company owner of that company.
     */
    public function activate(User $user, Sop $sop): bool
    {
        return $this->update($user, $sop);
    }

    /**
     * Determine whether the user can adopt a global SOP.
     * Company owner can adopt global SOPs for their company.
     */
    public function adopt(User $user, Sop $sop): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('company_owner')) {
            return $sop->company_id === null; // Only global SOPs can be adopted
        }

        return false;
    }
}
