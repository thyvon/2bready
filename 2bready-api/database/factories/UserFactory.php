<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'locale' => 'en',
            'status' => 'active',
            'current_company_id' => null,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withRole(string $role): static
    {
        return $this->afterCreating(function (User $user) use ($role) {
            $user->assignRole($role);
        });
    }

    public function admin(): static
    {
        return $this->withRole('admin');
    }

    public function companyOwner(): static
    {
        return $this->withRole('company_owner');
    }

    /**
     * Attaches the user to a company (company_user membership) and makes it
     * their active one — the factory-side equivalent of RegisterOwnCompanyAction,
     * replacing what used to be a plain `company_id` attribute (§0.7 of the MVP
     * proposal — a user can belong to more than one company now).
     */
    public function withCompany(Company $company): static
    {
        return $this->state(['current_company_id' => $company->id])
            ->afterCreating(function (User $user) use ($company) {
                $user->companies()->syncWithoutDetaching([$company->id]);
            });
    }

    public function withTotp(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('JBSWY3DPEHPK3PXP'),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }
}
