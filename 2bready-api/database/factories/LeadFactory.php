<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Package\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'company_id' => null,
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => null,
            'company_name' => fake()->company(),
            'source' => 'paywall',
        ];
    }
}
