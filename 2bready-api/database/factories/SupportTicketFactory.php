<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Support\Models\SupportTicket;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupportTicket>
 */
class SupportTicketFactory extends Factory
{
    protected $model = SupportTicket::class;

    public function definition(): array
    {
        return [
            'company_id' => CompanyFactory::new(),
            'created_by' => User::factory()->companyOwner(),
            'category' => fake()->randomElement(['general', 'billing', 'technical', 'consultation']),
            'subject' => fake()->sentence(4),
            'status' => 'open',
        ];
    }
}
