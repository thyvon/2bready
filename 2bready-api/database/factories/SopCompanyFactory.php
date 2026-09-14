<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopCompany;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SopCompany>
 */
class SopCompanyFactory extends Factory
{
    protected $model = SopCompany::class;

    public function definition(): array
    {
        $globalSop = Sop::query()->global()->inRandomOrder()->first();

        return [
            'sop_id' => $globalSop?->id ?? Sop::factory()->global()->create()->id,
            'company_id' => Company::query()->inRandomOrder()->first()?->id ?? Company::factory()->create()->id,
            'override_content_en' => $this->faker->optional(0.3)->paragraphs(2, true),
            'override_content_kh' => $this->faker->optional(0.3)->paragraphs(2, true),
            'adopted_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'adopted_by_user_id' => User::query()->inRandomOrder()->first()?->id,
        ];
    }
}
