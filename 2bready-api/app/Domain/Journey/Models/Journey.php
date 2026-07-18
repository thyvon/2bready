<?php

declare(strict_types=1);

namespace App\Domain\Journey\Models;

use App\Domain\Journey\Enums\JourneyStatus;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\JourneyFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property JourneyStatus $status
 *
 * @use HasFactory<JourneyFactory>
 */
class Journey extends Model
{
    /** @use HasFactory<JourneyFactory> */
    use Auditable, BelongsToCompany, HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<Journey> */
    protected static function newFactory(): Factory
    {
        return JourneyFactory::new();
    }

    protected $fillable = [
        'company_id',
        'journey_template_id',
        'status',
        'activated_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => JourneyStatus::class,
            'activated_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<JourneyTemplate, $this> */
    public function journeyTemplate(): BelongsTo
    {
        return $this->belongsTo(JourneyTemplate::class);
    }
}
