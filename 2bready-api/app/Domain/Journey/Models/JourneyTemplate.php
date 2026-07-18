<?php

declare(strict_types=1);

namespace App\Domain\Journey\Models;

use App\Domain\Industry\Models\Industry;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\HasUlid;
use Database\Factories\JourneyTemplateFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property bool $is_active
 *
 * @use HasFactory<JourneyTemplateFactory>
 */
class JourneyTemplate extends Model
{
    /** @use HasFactory<JourneyTemplateFactory> */
    use Auditable, HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<JourneyTemplate> */
    protected static function newFactory(): Factory
    {
        return JourneyTemplateFactory::new();
    }

    protected $fillable = [
        'country_code',
        'industry_id',
        'name',
        'name_kh',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<Industry, $this> */
    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    /** @return HasMany<JourneyLevel, $this> */
    public function levels(): HasMany
    {
        return $this->hasMany(JourneyLevel::class)->orderBy('sort_order');
    }
}
