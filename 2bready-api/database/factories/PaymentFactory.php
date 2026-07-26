<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\Payment\Models\Payment;
use App\Domain\Payment\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'payable_type' => 'subscription',
            'payable_id' => Subscription::factory(),
            'amount_cents' => 9900,
            'currency' => 'USD',
            'method' => 'manual_bank_transfer',
            'status' => 'pending',
            'gateway_reference' => fake()->bothify('PAY-########'),
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);
    }
}
