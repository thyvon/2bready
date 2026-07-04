<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Package\Models\Package;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Package>
 */
class PackageFactory extends Factory
{
    protected $model = Package::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'name_kh' => null,
            'description' => fake()->sentence(),
            'price_cents' => fake()->randomElement([9900, 19900, 49900]),
            'billing_period' => 'monthly',
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['is_active' => false]);
    }
}
