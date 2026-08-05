<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Models;

use App\Domain\Marketplace\Enums\TpHirePayoutStatus;
use App\Domain\Marketplace\Enums\TpHireStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\TpPartner\Models\TpPartner;
use App\Domain\User\Models\User;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\TpHireFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * A company's paid engagement of a TpPartner to review its documents at a
 * given journey level. company_id makes this genuinely tenant-scoped data
 * (Rule #1) — but the caller scoping it by TP-firm membership (TP staff, via
 * DocumentPolicy::manage()/TpAssignmentController) is never company-bypassed
 * the way admin/staff/finance are, so those callers must explicitly
 * withoutGlobalScope('company'), same pattern as Document's back-office
 * queries.
 *
 * @property TpHireStatus $status
 * @property TpHirePayoutStatus $payout_status
 *
 * @use HasFactory<TpHireFactory>
 */
class TpHire extends Model
{
    /** @use HasFactory<TpHireFactory> */
    use Auditable, BelongsToCompany, HasFactory, HasUlid;

    /** @return Factory<TpHire> */
    protected static function newFactory(): Factory
    {
        return TpHireFactory::new();
    }

    protected $fillable = [
        'company_id',
        'tp_partner_id',
        'journey_level',
        'price_agreed_cents',
        'platform_commission_cents',
        'tp_payout_cents',
        'status',
        'payout_status',
        'assigned_by_user_id',
        'payout_confirmed_by',
        'payout_confirmed_at',
        'hired_at',
        'completed_at',
        'cancelled_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'price_agreed_cents' => 'integer',
            'platform_commission_cents' => 'integer',
            'tp_payout_cents' => 'integer',
            'status' => TpHireStatus::class,
            'payout_status' => TpHirePayoutStatus::class,
            'hired_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'payout_confirmed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<TpPartner, $this> */
    public function tpPartner(): BelongsTo
    {
        return $this->belongsTo(TpPartner::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    /** @return MorphMany<Payment, $this> */
    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    /** @return HasOne<TpRating, $this> */
    public function rating(): HasOne
    {
        return $this->hasOne(TpRating::class);
    }

    public function isActive(): bool
    {
        return $this->status === TpHireStatus::Active;
    }
}
