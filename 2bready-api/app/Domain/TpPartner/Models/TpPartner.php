<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Models;

use App\Domain\TpPartner\Enums\TpPartnerStatus;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\HasUlid;
use Database\Factories\TpPartnerFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * The audit firm/vendor itself — parallel structure to Company, but never a
 * Company (§0.3/§1.5 of the MVP proposal: two distinct tenant types, never
 * unified into one polymorphic "organizations" table). Registered by 2bReady
 * admin only — no self-service signup, per the confirmed v1 scope.
 *
 * @property TpPartnerStatus $status
 *
 * @use HasFactory<TpPartnerFactory>
 */
class TpPartner extends Model
{
    /** @use HasFactory<TpPartnerFactory> */
    use Auditable, HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<TpPartner> */
    protected static function newFactory(): Factory
    {
        return TpPartnerFactory::new();
    }

    protected $fillable = [
        'name',
        'name_kh',
        'status',
        'price_l2_cents',
        'price_l3_cents',
        'price_l4_cents',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => TpPartnerStatus::class,
            'price_l2_cents' => 'integer',
            'price_l3_cents' => 'integer',
            'price_l4_cents' => 'integer',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === TpPartnerStatus::Active;
    }

    /** Snapshot price for a given level — see TpHire.price_agreed_cents. */
    public function priceFor(string $journeyLevel): ?int
    {
        return match ($journeyLevel) {
            'L2' => $this->price_l2_cents,
            'L3' => $this->price_l3_cents,
            'L4' => $this->price_l4_cents,
            default => null,
        };
    }

    /** @return HasMany<Auditor, $this> */
    public function auditors(): HasMany
    {
        return $this->hasMany(Auditor::class);
    }
}
