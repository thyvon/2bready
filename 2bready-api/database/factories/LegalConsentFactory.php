<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\LegalConsent\Enums\PathwayLevel;
use App\Domain\LegalConsent\Models\LegalConsent;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LegalConsent>
 */
class LegalConsentFactory extends Factory
{
    protected $model = LegalConsent::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'company_id' => Company::factory(),
            'pathway_level' => PathwayLevel::P3,
            'consent_text_version' => 'v1',
            'accepted_at' => now(),
            'ip_address' => null,
        ];
    }
}
