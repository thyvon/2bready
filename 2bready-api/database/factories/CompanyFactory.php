<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'name_kh' => null,
            'registration_no' => null,
            'employee_count' => null,
            'bypass_flags' => [],
            'industry_code' => 'F&B',
            'country_code' => 'KH',
            'status' => 'active',
            'compliance_score' => 0,
            'default_locale' => 'en',
        ];
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }

    public function withEmployeeCount(int $count): static
    {
        return $this->state(fn (array $attributes) => [
            'employee_count' => $count,
        ]);
    }
}
