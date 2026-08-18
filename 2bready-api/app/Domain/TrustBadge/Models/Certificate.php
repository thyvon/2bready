<?php

declare(strict_types=1);

namespace App\Domain\TrustBadge\Models;

use App\Domain\Audit\Models\Audit;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * The issued certificate artifact for a trust badge — the PDF + QR the
 * public verify page serves (v3 §1.6). Deliberately has no company_id and no
 * BelongsToCompany: the public verify route reads certificates by audit_id
 * through a narrow, denormalized lookup and must never touch a tenant path
 * (v3 §1.5). master_verifier_stamp is a snapshot of the platform_settings
 * verifier text at issuance, so historical certificates don't change if the
 * setting is later updated (v3 §0.3). No updated_at — a certificate is issued
 * once.
 *
 * @property string $pdf_url
 * @property string $qr_payload_url
 * @property array<string, string> $master_verifier_stamp
 * @property Carbon|null $issued_at
 */
class Certificate extends Model
{
    use HasUlid;

    public const UPDATED_AT = null;

    protected $fillable = [
        'trust_badge_id',
        'audit_id',
        'pdf_url',
        'qr_payload_url',
        'master_verifier_stamp',
        'issued_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'master_verifier_stamp' => 'array',
            'issued_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<TrustBadge, $this> */
    public function trustBadge(): BelongsTo
    {
        return $this->belongsTo(TrustBadge::class);
    }

    /** @return BelongsTo<Audit, $this> */
    public function audit(): BelongsTo
    {
        return $this->belongsTo(Audit::class);
    }
}
