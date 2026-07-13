<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\JourneyTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Journey>
 */
class JourneyFactory extends Factory
{
    protected $model = Journey::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'journey_template_id' => JourneyTemplate::factory(),
            'status' => 'active',
            'activated_at' => now(),
        ];
    }
}
