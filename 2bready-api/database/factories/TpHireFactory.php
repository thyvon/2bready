<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\TpPartner\Models\TpPartner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TpHire>
 */
class TpHireFactory extends Factory
{
    protected $model = TpHire::class;

    public function definition(): array
    {
        $priceAgreedCents = 39900;
        $commissionCents = (int) round($priceAgreedCents * 0.15);

        return [
            'company_id' => Company::factory(),
            'tp_partner_id' => TpPartner::factory(),
            'journey_level' => 'L3',
            'price_agreed_cents' => $priceAgreedCents,
            'platform_commission_cents' => $commissionCents,
            'tp_payout_cents' => $priceAgreedCents - $commissionCents,
            'status' => 'pending_payment',
            'payout_status' => 'unpaid',
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'hired_at' => now(),
        ]);
    }
}
