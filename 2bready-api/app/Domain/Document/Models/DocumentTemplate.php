<?php

declare(strict_types=1);

namespace App\Domain\Document\Models;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Enums\RecurrenceType;
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
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * @property bool $is_required
 * @property RecurrenceType $recurrence_type
 * @property int|null $expiry_months
 * @property Carbon|null $effective_since
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
        'parent_id',
        'company_id',
        'name',
        'description',
        'is_required',
        'recurrence_type',
        'expiry_months',
        'effective_since',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'recurrence_type' => RecurrenceType::class,
            'expiry_months' => 'integer',
            'effective_since' => 'date',
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

    /** @return BelongsTo<DocumentTemplate, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class, 'parent_id');
    }

    /** @return HasMany<DocumentTemplate, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(DocumentTemplate::class, 'parent_id')->orderBy('sort_order');
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Turns an already-fetched flat collection into a nested tree in memory
     * (setRelation, not a real query) — supports unlimited depth with zero
     * extra queries, since the whole flat set for a milestone/company scope
     * is fetched once by the caller before this runs.
     *
     * @param  Collection<int, DocumentTemplate>  $flat
     * @return Collection<int, DocumentTemplate>
     */
    public static function nestFlat(Collection $flat, ?string $parentId = null): Collection
    {
        return $flat->where('parent_id', $parentId)->values()->map(function (DocumentTemplate $node) use ($flat) {
            $node->setRelation('children', static::nestFlat($flat, $node->id));

            return $node;
        });
    }
}
