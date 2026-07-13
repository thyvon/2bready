<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Models\Milestone;
use App\Domain\Journey\Models\MilestoneCompletion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MilestoneCompletion>
 */
class MilestoneCompletionFactory extends Factory
{
    protected $model = MilestoneCompletion::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'milestone_id' => Milestone::factory(),
            'completed_at' => now(),
            'completed_by_user_id' => null,
            'trigger' => 'admin_signoff',
        ];
    }
}
