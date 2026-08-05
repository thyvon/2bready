<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Marketplace\Models\TpRating;
use App\Domain\Marketplace\Models\TpHire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TpRating>
 */
class TpRatingFactory extends Factory
{
    protected $model = TpRating::class;

    public function definition(): array
    {
        $hire = TpHire::factory()->active()->create();

        return [
            'tp_hire_id' => $hire->id,
            'company_id' => $hire->company_id,
            'tp_partner_id' => $hire->tp_partner_id,
            'rating' => fake()->numberBetween(3, 5),
            'review_text' => fake()->optional(0.7)->sentence(),
        ];
    }
}
