<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Industry\Models\Industry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Industry>
 */
class IndustryFactory extends Factory
{
    protected $model = Industry::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->lexify('IND???')),
            'name' => fake()->words(2, true),
            'name_kh' => null,
            'description' => fake()->sentence(),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['is_active' => false]);
    }
}
