<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopSignoff;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SopSignoff>
 */
class SopSignoffFactory extends Factory
{
    protected $model = SopSignoff::class;

    public function definition(): array
    {
        return [
            'sop_id' => Sop::query()->inRandomOrder()->first()?->id ?? Sop::factory()->create()->id,
            'company_id' => Company::query()->inRandomOrder()->first()?->id ?? Company::factory()->create()->id,
            'user_id' => User::query()->inRandomOrder()->first()?->id ?? User::factory()->create()->id,
            'sent_by_user_id' => User::query()->inRandomOrder()->first()?->id,
            'signed_at' => $this->faker->optional(0.5)->dateTimeBetween('-1 month', 'now'),
        ];
    }

    /** A pending (not yet acknowledged) sign-off */
    public function pending(): static
    {
        return $this->state(fn () => ['signed_at' => null]);
    }

    /** An acknowledged sign-off */
    public function acknowledged(): static
    {
        return $this->state(fn () => ['signed_at' => now()]);
    }
}
