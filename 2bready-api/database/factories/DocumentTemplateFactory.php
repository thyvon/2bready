<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Milestone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentTemplate>
 */
class DocumentTemplateFactory extends Factory
{
    protected $model = DocumentTemplate::class;

    public function definition(): array
    {
        return [
            'milestone_id' => Milestone::factory(),
            'name' => fake()->words(3, true),
            'description' => null,
            'is_required' => true,
            'expiry_months' => null,
            'sort_order' => 0,
        ];
    }
}
