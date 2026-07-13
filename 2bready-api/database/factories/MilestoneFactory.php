<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\Milestone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Milestone>
 */
class MilestoneFactory extends Factory
{
    protected $model = Milestone::class;

    public function definition(): array
    {
        return [
            'journey_level_id' => JourneyLevel::factory(),
            'name' => fake()->words(2, true),
            'sort_order' => 0,
        ];
    }
}
