<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use App\Domain\Vault\Models\VaultUnlockLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VaultUnlockLog>
 */
class VaultUnlockLogFactory extends Factory
{
    protected $model = VaultUnlockLog::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'company_id' => Company::factory(),
            'unlocked_at' => now(),
            'locked_at' => null,
            'lock_reason' => null,
        ];
    }

    public function locked(): static
    {
        return $this->state(fn (array $attributes) => [
            'locked_at' => now(),
            'lock_reason' => 'manual',
        ]);
    }
}
