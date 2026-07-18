<?php

declare(strict_types=1);

namespace App\Domain\Document\Models;

use App\Domain\Journey\Models\Milestone;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\HasUlid;
use Database\Factories\DocumentTemplateFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property bool $is_required
 *
 * @use HasFactory<DocumentTemplateFactory>
 */
class DocumentTemplate extends Model
{
    /** @use HasFactory<DocumentTemplateFactory> */
    use Auditable, HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<DocumentTemplate> */
    protected static function newFactory(): Factory
    {
        return DocumentTemplateFactory::new();
    }

    protected $fillable = [
        'milestone_id',
        'name',
        'description',
        'is_required',
        'expiry_months',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'expiry_months' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<Milestone, $this> */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(Milestone::class);
    }

    /** @return HasMany<Document, $this> */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
