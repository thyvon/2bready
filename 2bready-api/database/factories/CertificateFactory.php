<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Audit\Models\Audit;
use App\Domain\TrustBadge\Models\Certificate;
use App\Domain\TrustBadge\Models\TrustBadge;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Certificate>
 */
class CertificateFactory extends Factory
{
    protected $model = Certificate::class;

    public function definition(): array
    {
        return [
            'trust_badge_id' => TrustBadge::factory(),
            'audit_id' => Audit::factory(),
            'pdf_url' => 'certificates/'.(string) $this->faker->uuid().'.pdf',
            'qr_payload_url' => 'https://verify.2bready.asia/'.(string) $this->faker->unique()->uuid(),
            'master_verifier_stamp' => [
                'verified_by' => 'ADMIT UNIT Master Auditors',
                'approved_by' => 'ADMIT Global Executive',
                'prepared_by' => '2bReady Trust Engine Powered by ADMIT Global',
            ],
            'issued_at' => now(),
        ];
    }
}
