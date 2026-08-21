<?php

declare(strict_types=1);

namespace App\Domain\Sop\Models;

use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\SopCompanyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Company adoption of a global SOP with optional content overrides.
 *
 * A company "adopts" a platform-wide SOP (company_id = null on the Sop row)
 * and may provide override content in EN/KH. The effective content for the
 * company is: override if present, else the global SOP's content.
 *
 * @use HasFactory<SopCompanyFactory>
 */
class SopCompany extends Model
{
    /** @use HasFactory<SopCompanyFactory> */
    use BelongsToCompany, HasFactory, HasUlid;

    protected $table = 'sop_company';

    protected static function newFactory(): SopCompanyFactory
    {
        return SopCompanyFactory::new();
    }

    protected $fillable = [
        'sop_id',
        'company_id',
        'override_content_en',
        'override_content_kh',
        'adopted_at',
        'adopted_by_user_id',
    ];

    protected $casts = [
        'adopted_at' => 'datetime',
    ];

    /** @return BelongsTo<Sop, $this> */
    public function sop(): BelongsTo
    {
        return $this->belongsTo(Sop::class);
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<User, $this> */
    public function adoptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adopted_by_user_id');
    }
}
