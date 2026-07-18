<?php

declare(strict_types=1);

namespace App\Domain\Journey\Models;

use App\Domain\Document\Models\DocumentTemplate;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\HasUlid;
use Database\Factories\MilestoneFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @use HasFactory<MilestoneFactory>
 */
class Milestone extends Model
{
    /** @use HasFactory<MilestoneFactory> */
    use Auditable, HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<Milestone> */
    protected static function newFactory(): Factory
    {
        return MilestoneFactory::new();
    }

    protected $fillable = [
        'journey_level_id',
        'name',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<JourneyLevel, $this> */
    public function journeyLevel(): BelongsTo
    {
        return $this->belongsTo(JourneyLevel::class);
    }

    /** @return HasMany<MilestoneCompletion, $this> */
    public function completions(): HasMany
    {
        return $this->hasMany(MilestoneCompletion::class);
    }

    // Cross-domain FK (Document domain owns DocumentTemplate) — mirrors
    // DocumentTemplate::milestone()'s inverse side. A plain read relation,
    // not a business action, so this doesn't need the event/listener rule.
    /** @return HasMany<DocumentTemplate, $this> */
    public function documentTemplates(): HasMany
    {
        return $this->hasMany(DocumentTemplate::class);
    }
}
