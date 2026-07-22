<?php

declare(strict_types=1);

namespace App\Domain\DataRoom\Models;

use App\Domain\Company\Models\Company;
use App\Domain\DataRoom\Enums\DataRoomLinkStatus;
use App\Domain\User\Models\User;
use App\Support\Concerns\HasUlid;
use Database\Factories\DataRoomLinkFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Deliberately does NOT use BelongsToCompany — the public verify/preview
 * routes (VerifyDataRoomAccessAction) are unauthenticated, so that trait's
 * auth()-derived global scope would be a no-op there anyway. Looked up by
 * raw `token` on the public path; authenticated Actions
 * (CreateDataRoomLinkAction/RevokeDataRoomLinkAction) filter by
 * auth()->user()->current_company_id explicitly instead.
 *
 * @property Carbon|null $expires_at
 * @property Carbon|null $revoked_at
 *
 * @use HasFactory<DataRoomLinkFactory>
 */
class DataRoomLink extends Model
{
    /** @use HasFactory<DataRoomLinkFactory> */
    use HasFactory, HasUlid;

    /** @return Factory<DataRoomLink> */
    protected static function newFactory(): Factory
    {
        return DataRoomLinkFactory::new();
    }

    protected $fillable = [
        'company_id',
        'created_by',
        'token',
        'pin_hash',
        'expires_at',
        'revoked_at',
    ];

    protected $hidden = [
        'pin_hash',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<User, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isActive(): bool
    {
        return $this->status() === DataRoomLinkStatus::Active;
    }

    // Computed, not stored (see DataRoomLinkStatus's own docblock) —
    // revoked takes precedence over expired since both can be true at once
    // (a link revoked after it already expired), and "why is this dead" is
    // more useful to surface as "you revoked it" than "it timed out".
    public function status(): DataRoomLinkStatus
    {
        if ($this->revoked_at !== null) {
            return DataRoomLinkStatus::Revoked;
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return DataRoomLinkStatus::Expired;
        }

        return DataRoomLinkStatus::Active;
    }
}
