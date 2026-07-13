<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Industry\Models\Industry;
use App\Domain\Journey\Models\JourneyTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JourneyTemplate>
 */
class JourneyTemplateFactory extends Factory
{
    protected $model = JourneyTemplate::class;

    public function definition(): array
    {
        return [
            'country_code' => 'KH',
            'industry_id' => Industry::factory(),
            'name' => fake()->words(3, true),
            'name_kh' => null,
            'is_active' => true,
        ];
    }
}
