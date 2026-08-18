<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Audit\Models\Audit;
use App\Domain\Company\Models\Company;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\TrustBadge\Models\TrustBadge;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrustBadge>
 */
class TrustBadgeFactory extends Factory
{
    protected $model = TrustBadge::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'journey_level_id' => JourneyLevel::factory(),
            'audit_id' => Audit::factory(),
            'level' => 'L3',
            'issued_at' => now(),
            'expires_at' => null,
            'qr_payload_url' => null,
            'issued_by' => null,
        ];
    }
}
