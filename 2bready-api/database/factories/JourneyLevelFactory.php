<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JourneyLevel>
 */
class JourneyLevelFactory extends Factory
{
    protected $model = JourneyLevel::class;

    public function definition(): array
    {
        return [
            'journey_template_id' => JourneyTemplate::factory(),
            'code' => 'L'.fake()->unique()->numberBetween(1, 4),
            'name' => fake()->word(),
            'pathway_name' => fake()->words(2, true),
            'pillar' => fake()->randomElement(['comply', 'scale', 'lead']),
            'sort_order' => 0,
        ];
    }
}
