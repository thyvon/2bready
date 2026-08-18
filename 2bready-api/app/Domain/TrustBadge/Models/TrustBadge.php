<?php

declare(strict_types=1);

namespace App\Domain\TrustBadge\Models;

use App\Domain\Audit\Models\Audit;
use App\Domain\Company\Models\Company;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\User\Models\User;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * A level a company has earned through an approved audit — the v3 payoff.
 * Tenant-scoped like every company-owned record (Rule #1); the certificate
 * that extends it (PDF/QR artifacts) lives on the certificates table, and the
 * public verify page reads certificates by audit_id directly, never through
 * this tenant path (v3 §1.5).
 *
 * @property string $level
 * @property Carbon|null $issued_at
 * @property Carbon|null $expires_at
 * @property string|null $qr_payload_url
 * @property string|null $issued_by
 */
class TrustBadge extends Model
{
    use Auditable, BelongsToCompany, HasUlid;

    protected $fillable = [
        'company_id',
        'journey_level_id',
        'audit_id',
        'level',
        'issued_at',
        'expires_at',
        'qr_payload_url',
        'issued_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<JourneyLevel, $this> */
    public function journeyLevel(): BelongsTo
    {
        return $this->belongsTo(JourneyLevel::class);
    }

    /** @return BelongsTo<Audit, $this> */
    public function audit(): BelongsTo
    {
        return $this->belongsTo(Audit::class);
    }

    /** @return BelongsTo<User, $this> */
    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    /** @return HasOne<Certificate, $this> */
    public function certificate(): HasOne
    {
        return $this->hasOne(Certificate::class);
    }
}
