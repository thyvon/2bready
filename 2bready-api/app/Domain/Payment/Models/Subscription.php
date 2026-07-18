<?php

declare(strict_types=1);

namespace App\Domain\Payment\Models;

use App\Domain\Package\Models\Package;
use App\Domain\Payment\Enums\SubscriptionStatus;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property SubscriptionStatus $status
 *
 * @use HasFactory<SubscriptionFactory>
 */
class Subscription extends Model
{
    /** @use HasFactory<SubscriptionFactory> */
    use Auditable, BelongsToCompany, HasFactory, HasUlid;

    /** @return Factory<Subscription> */
    protected static function newFactory(): Factory
    {
        return SubscriptionFactory::new();
    }

    protected $fillable = [
        'company_id',
        'package_id',
        'status',
        'started_at',
        'expires_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Package, $this> */
    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function isActive(): bool
    {
        return $this->status === SubscriptionStatus::Active;
    }
}
