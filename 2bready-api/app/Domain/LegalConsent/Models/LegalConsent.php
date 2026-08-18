<?php

declare(strict_types=1);

namespace App\Domain\LegalConsent\Models;

use App\Domain\LegalConsent\Enums\PathwayLevel;
use App\Domain\User\Models\User;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\LegalConsentFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One accepted consent per (user, company, pathway_level, consent_text_version)
 * — versioned so old consents remain valid evidence after the terms are
 * updated (v3 §5.1). The consent text itself lives in platform_settings
 * (legal_consent_text_* / legal_consent_version); this row records that a
 * specific user accepted a specific version. Every row also writes an
 * audit_logs entry (action: legal_consent_recorded) via its domain event.
 *
 * @property PathwayLevel $pathway_level
 * @property string $consent_text_version
 * @property Carbon $accepted_at
 * @property string|null $ip_address
 */
class LegalConsent extends Model
{
    /** @use HasFactory<LegalConsentFactory> */
    use BelongsToCompany, HasFactory, HasUlid;

    /** @return Factory<LegalConsent> */
    protected static function newFactory(): Factory
    {
        return LegalConsentFactory::new();
    }

    protected $fillable = [
        'user_id',
        'company_id',
        'pathway_level',
        'consent_text_version',
        'accepted_at',
        'ip_address',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'pathway_level' => PathwayLevel::class,
            'accepted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
