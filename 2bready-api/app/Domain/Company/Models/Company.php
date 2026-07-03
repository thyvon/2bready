<?php

declare(strict_types=1);

namespace App\Domain\Company\Models;

use App\Domain\Company\Enums\CompanyStatus;
use App\Domain\User\Models\User;
use App\Support\Concerns\HasUlid;
use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property CompanyStatus $status
 * @property int|null $employee_count
 * @property array<string, bool> $bypass_flags
 *
 * @use HasFactory<CompanyFactory>
 */
class Company extends Model
{
    /** @use HasFactory<CompanyFactory> */
    use HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<Company> */
    protected static function newFactory(): Factory
    {
        return CompanyFactory::new();
    }

    protected $fillable = [
        'name',
        'name_kh',
        'registration_no',
        'employee_count',
        'bypass_flags',
        'industry_code',
        'country_code',
        'status',
        'compliance_score',
        'default_locale',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'employee_count' => 'integer',
            'bypass_flags' => 'array',
            'compliance_score' => 'integer',
            'status' => CompanyStatus::class,
        ];
    }

    /** @return HasMany<User, $this> */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === CompanyStatus::Active;
    }
}
