<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Company\Models\Company;
use App\Domain\DataRoom\Models\DataRoomLink;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<DataRoomLink>
 */
class DataRoomLinkFactory extends Factory
{
    protected $model = DataRoomLink::class;

    protected static ?string $pin;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'created_by' => User::factory()->companyOwner(),
            'token' => Str::random(64),
            'pin_hash' => static::$pin ??= Hash::make('TESTPIN1'),
            'expires_at' => now()->addDays(7),
            'revoked_at' => null,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDay(),
        ]);
    }

    public function revoked(): static
    {
        return $this->state(fn (array $attributes) => [
            'revoked_at' => now(),
        ]);
    }
}
