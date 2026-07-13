<?php

declare(strict_types=1);

namespace App\Domain\Journey\Models;

use App\Domain\Journey\Enums\JourneyPillar;
use App\Support\Concerns\HasUlid;
use Database\Factories\JourneyLevelFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property JourneyPillar $pillar
 *
 * @use HasFactory<JourneyLevelFactory>
 */
class JourneyLevel extends Model
{
    /** @use HasFactory<JourneyLevelFactory> */
    use HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<JourneyLevel> */
    protected static function newFactory(): Factory
    {
        return JourneyLevelFactory::new();
    }

    protected $fillable = [
        'journey_template_id',
        'code',
        'name',
        'pathway_name',
        'pillar',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'pillar' => JourneyPillar::class,
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<JourneyTemplate, $this> */
    public function journeyTemplate(): BelongsTo
    {
        return $this->belongsTo(JourneyTemplate::class);
    }

    /** @return HasMany<Milestone, $this> */
    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class)->orderBy('sort_order');
    }
}
