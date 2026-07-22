<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'document_template_id' => DocumentTemplate::factory(),
            'uploaded_by_user_id' => null,
            'file_path' => 'documents/'.fake()->uuid().'.pdf',
            'original_filename' => fake()->word().'.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => fake()->numberBetween(10_000, 2_000_000),
            'status' => 'pending_scan',
            'period_key' => null,
            'rejection_reason' => null,
            'verified_by_user_id' => null,
            'verified_at' => null,
            'expires_at' => null,
            'expiry_reminded_at' => null,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'verified',
            'verified_at' => now(),
        ]);
    }

    /** A verified document already past its expiry window (for ExpireOverdueDocumentsAction). */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'verified',
            'verified_at' => now()->subMonths(13),
            'expires_at' => now()->subDay(),
        ]);
    }

    /** A verified document whose expiry falls inside the reminder window. */
    public function expiringInDays(int $days): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'verified',
            'verified_at' => now(),
            'expires_at' => now()->addDays($days),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejection_reason' => fake()->sentence(),
        ]);
    }
}
