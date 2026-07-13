<?php

declare(strict_types=1);

namespace App\Domain\Package\Models;

use App\Domain\Industry\Models\Industry;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Package\Enums\BillingPeriod;
use App\Domain\Package\Enums\Tier;
use App\Support\Concerns\HasUlid;
use Database\Factories\PackageFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $price_cents
 * @property BillingPeriod $billing_period
 * @property Tier $tier
 * @property bool $is_active
 *
 * @use HasFactory<PackageFactory>
 */
class Package extends Model
{
    /** @use HasFactory<PackageFactory> */
    use HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<Package> */
    protected static function newFactory(): Factory
    {
        return PackageFactory::new();
    }

    protected $fillable = [
        'industry_id',
        'journey_level_id',
        'name',
        'name_kh',
        'description',
        'price_cents',
        'billing_period',
        'tier',
        'is_active',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'billing_period' => BillingPeriod::class,
            'tier' => Tier::class,
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<Industry, $this> */
    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    // Which journey level a subscription to this package unlocks — the real
    // link the frontend's LEVEL_META lookup used to fake locally. Nullable:
    // not every package needs to gate a specific level (e.g. an add-on).
    /** @return BelongsTo<JourneyLevel, $this> */
    public function journeyLevel(): BelongsTo
    {
        return $this->belongsTo(JourneyLevel::class);
    }
}
