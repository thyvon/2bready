<?php

declare(strict_types=1);

namespace App\Domain\Company\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\User\Enums\UserStatus;
use App\Domain\User\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Back-office creation of a company-side account (company_owner or
 * company_member) directly into one company's team — admin-portal's
 * "add user" on a company, distinct from RegisterUserAction (client-portal
 * self-signup) and CreateInternalUserAction (internal roles).
 */
class AddCompanyUserAction
{
    public function execute(Company $company, string $name, string $email, string $password, string $role): User
    {
        if (User::where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['A user with this email already exists.'],
            ]);
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'status' => UserStatus::Active,
            // Pre-verified — created by an admin who already knows this is a
            // real address, not a self-registration needing inbox proof.
            'email_verified_at' => now(),
        ]);

        $user->syncRoles($role);
        $user->companies()->attach($company->id);

        return $user->load(['roles', 'companies']);
    }
}
