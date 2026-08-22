<?php

declare(strict_types=1);

namespace App\Domain\Sop\Models;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\SopSignoffFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Employee read-&-acknowledge record for an SOP (v3 Sprint 8 sign-off flow).
 *
 * A pending sign-off has signed_at = null; acknowledging stamps it. One row
 * per (sop, user) — re-sending to an already-assigned employee keeps the row.
 *
 * @property Carbon|null $signed_at
 *
 * @use HasFactory<SopSignoffFactory>
 */
class SopSignoff extends Model
{
    /** @use HasFactory<SopSignoffFactory> */
    use BelongsToCompany, HasFactory, HasUlid;

    protected $table = 'sop_signoffs';

    protected static function newFactory(): SopSignoffFactory
    {
        return SopSignoffFactory::new();
    }

    protected $fillable = [
        'sop_id',
        'company_id',
        'user_id',
        'sent_by_user_id',
        'signed_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    /** @return BelongsTo<Sop, $this> */
    public function sop(): BelongsTo
    {
        // Global SOPs (company_id = null) must resolve for every viewer — the
        // blanket tenant scope would null them out for company users.
        return $this->belongsTo(Sop::class)->withoutGlobalScope('company');
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function sentBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by_user_id');
    }
}
