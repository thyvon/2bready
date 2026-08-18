<?php

declare(strict_types=1);

namespace App\Domain\Company\Models;

use App\Domain\Company\Enums\CompanyStatus;
use App\Domain\Industry\Models\Industry;
use App\Domain\Payment\Models\Subscription;
use App\Domain\User\Models\User;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\HasUlid;
use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property CompanyStatus $status
 * @property int|null $employee_count
 * @property Carbon|null $compliance_start_date
 * @property array<string, bool> $bypass_flags
 * @property string|null $vault_pin_hash
 *
 * @use HasFactory<CompanyFactory>
 */
class Company extends Model
{
    /** @use HasFactory<CompanyFactory> */
    use Auditable, HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<Company> */
    protected static function newFactory(): Factory
    {
        return CompanyFactory::new();
    }

    protected $fillable = [
        'name',
        'name_kh',
        'registration_no',
        'compliance_start_date',
        'employee_count',
        'bypass_flags',
        'vault_pin_hash',
        'industry_id',
        'country_code',
        'status',
        'compliance_score',
        'default_locale',
        'active_subscription_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'employee_count' => 'integer',
            'compliance_start_date' => 'date',
            'bypass_flags' => 'array',
            'compliance_score' => 'integer',
            'status' => CompanyStatus::class,
        ];
    }

    /**
     * The inverse of User::companies() (§0.7 of the MVP proposal — a user
     * can belong to more than one company via the company_user pivot).
     * Was a broken hasMany(User::class) until now — that looks for a
     * company_id column on users, which was dropped from that table by the
     * 2026_07_05_000008 migration when membership moved to this pivot;
     * calling it would have thrown a SQL error. Nothing called it yet.
     *
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'company_user');
    }

    /** @return BelongsTo<Subscription, $this> */
    public function activeSubscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class, 'active_subscription_id');
    }

    /** @return BelongsTo<Industry, $this> */
    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function isActive(): bool
    {
        return $this->status === CompanyStatus::Active;
    }
}
