<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Support\Models\SupportTicketMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupportTicketMessage>
 */
class SupportTicketMessageFactory extends Factory
{
    protected $model = SupportTicketMessage::class;

    public function definition(): array
    {
        return [
            'support_ticket_id' => SupportTicketFactory::new(),
            // company_id mirrors the parent ticket's — set explicitly by the
            // caller when known; otherwise resolved from the ticket.
            'user_id' => UserFactory::new()->companyOwner(),
            'message' => fake()->paragraph(),
        ];
    }
}
