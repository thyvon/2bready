<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Models;

use App\Domain\Company\Models\Company;
use App\Domain\TpPartner\Models\TpPartner;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\TpRatingFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A company's 1–5 star review of a completed hire. Company-scoped data
 * (Rule #1) — the hire it belongs to is itself company-scoped, so the
 * global scope automatically keeps every rating on the right side of the
 * tenant boundary. One rating per hire, enforced by the unique index on
 * tp_hire_id.
 *
 * @use HasFactory<TpRatingFactory>
 */
class TpRating extends Model
{
    /** @use HasFactory<TpRatingFactory> */
    use Auditable, BelongsToCompany, HasFactory, HasUlid;

    /** @return Factory<TpRating> */
    protected static function newFactory(): Factory
    {
        return TpRatingFactory::new();
    }

    protected $fillable = [
        'tp_hire_id',
        'company_id',
        'tp_partner_id',
        'rating',
        'review_text',
        'created_by_user_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    /** @return BelongsTo<TpHire, $this> */
    public function tpHire(): BelongsTo
    {
        return $this->belongsTo(TpHire::class);
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<TpPartner, $this> */
    public function tpPartner(): BelongsTo
    {
        return $this->belongsTo(TpPartner::class);
    }
}
