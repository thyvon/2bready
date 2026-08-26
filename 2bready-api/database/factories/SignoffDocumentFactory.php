<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\SignOff\Enums\SignoffDocumentStatus;
use App\Domain\SignOff\Models\SignoffDocument;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SignoffDocument>
 */
class SignoffDocumentFactory extends Factory
{
    protected $model = SignoffDocument::class;

    public function definition(): array
    {
        return [
            'category' => fake()->randomElement(['sales', 'marketing', 'finance', 'production', 'hr', 'other']),
            'title' => fake()->sentence(3),
            'file_path' => 'signoff-documents/'.fake()->uuid().'.pdf',
            'original_filename' => fake()->word().'.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => fake()->numberBetween(10_000, 500_000),
            'status' => SignoffDocumentStatus::PendingReview->value,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SignoffDocumentStatus::Verified->value,
            'verified_by_user_id' => User::factory()->admin(),
            'verified_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => SignoffDocumentStatus::Rejected->value,
            'rejection_comment' => 'Please re-upload a legible copy.',
        ]);
    }
}
