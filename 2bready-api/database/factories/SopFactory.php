<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\Sop\Models\Sop;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sop>
 */
class SopFactory extends Factory
{
    protected $model = Sop::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'version' => $this->faker->randomElement(['1.0', '1.1', '2.0']),
            'content_en' => $this->faker->paragraphs(3, true),
            'content_kh' => $this->faker->paragraphs(3, true),
            'effective_at' => $this->faker->optional(0.7)->dateTimeBetween('-1 year', '+1 year'),
            'is_active' => $this->faker->boolean(80),
            // Global (platform-wide) by default — the primary SOP concept. Use
            // forCompany() for a company-scoped SOP.
            'company_id' => null,
            'created_by_user_id' => User::query()->inRandomOrder()->first()?->id,
        ];
    }

    /** Creates a global (platform-wide) SOP template */
    public function global(): static
    {
        return $this->state(fn () => ['company_id' => null]);
    }

    /** Creates a company-scoped SOP for a specific company */
    public function forCompany(Company $company): static
    {
        return $this->state(fn () => ['company_id' => $company->id]);
    }

    /** Creates an active SOP effective now */
    public function active(): static
    {
        return $this->state(fn () => [
            'is_active' => true,
            'effective_at' => now()->subDay(),
        ]);
    }
}
