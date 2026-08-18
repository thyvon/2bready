<?php

declare(strict_types=1);

namespace App\Domain\Vault\Models;

use App\Domain\User\Models\User;
use App\Domain\Vault\Enums\VaultLockReason;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\VaultUnlockLogFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One row per vault unlock session — the access trail (v3 §5.1). A row is
 * "open" while locked_at is null; any of timeout/manual/role_change closes
 * it. companies.vault_pin_hash is the PIN store; this table is the trail.
 *
 * @property Carbon $unlocked_at
 * @property Carbon|null $locked_at
 * @property VaultLockReason|null $lock_reason
 */
class VaultUnlockLog extends Model
{
    /** @use HasFactory<VaultUnlockLogFactory> */
    use BelongsToCompany, HasFactory, HasUlid;

    /** @return Factory<VaultUnlockLog> */
    protected static function newFactory(): Factory
    {
        return VaultUnlockLogFactory::new();
    }

    protected $fillable = [
        'user_id',
        'company_id',
        'unlocked_at',
        'locked_at',
        'lock_reason',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'unlocked_at' => 'datetime',
            'locked_at' => 'datetime',
            'lock_reason' => VaultLockReason::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isOpen(): bool
    {
        return $this->locked_at === null;
    }
}
