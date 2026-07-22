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
            // Not fake()->unique() — the real constraint (see the migration)
            // is a composite unique on (journey_template_id, code), not a
            // global one. fake()->unique() tracks uniqueness for the whole
            // test process, not per template, so it silently exhausts after
            // only 4 calls (there are only 4 possible L1-L4 values) the
            // moment any test creates more than 4 JourneyLevel rows in one
            // run — a real latent bug, not a style choice.
            'code' => 'L'.fake()->numberBetween(1, 4),
            'name' => fake()->word(),
            'pathway_name' => fake()->words(2, true),
            'pillar' => fake()->randomElement(['comply', 'scale', 'lead']),
            'sort_order' => 0,
        ];
    }
}
