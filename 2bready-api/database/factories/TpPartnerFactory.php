<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\TpPartner\Models\TpPartner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TpPartner>
 */
class TpPartnerFactory extends Factory
{
    protected $model = TpPartner::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'status' => 'active',
            'price_l2_cents' => 19900,
            'price_l3_cents' => 39900,
            'price_l4_cents' => 79900,
        ];
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'suspended']);
    }
}
