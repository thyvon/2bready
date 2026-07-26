<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Models;

use App\Domain\User\Models\User;
use App\Support\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Profile table, per the backend's own documented Rule #4: "Auditors are
 * Users — auditors is a profile table. Auditors authenticate through the
 * standard users table with the auditor role." This model holds only the
 * TP-specific profile fields (which firm), never credentials.
 *
 * No Auditable trait — nothing on this row is independently business-
 * meaningful to audit beyond the User/TpPartner mutations that already are.
 */
class Auditor extends Model
{
    use HasUlid;

    protected $fillable = [
        'user_id',
        'tp_partner_id',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<TpPartner, $this> */
    public function tpPartner(): BelongsTo
    {
        return $this->belongsTo(TpPartner::class);
    }
}
