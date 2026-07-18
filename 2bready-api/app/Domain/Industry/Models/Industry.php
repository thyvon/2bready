<?php

declare(strict_types=1);

namespace App\Domain\Industry\Models;

use App\Domain\Company\Models\Company;
use App\Domain\Package\Models\Package;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\HasUlid;
use Database\Factories\IndustryFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $code
 * @property bool $is_active
 *
 * @use HasFactory<IndustryFactory>
 */
class Industry extends Model
{
    /** @use HasFactory<IndustryFactory> */
    use Auditable, HasFactory, HasUlid, SoftDeletes;

    /** @return Factory<Industry> */
    protected static function newFactory(): Factory
    {
        return IndustryFactory::new();
    }

    protected $fillable = [
        'code',
        'name',
        'name_kh',
        'description',
        'is_active',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return HasMany<Package, $this> */
    public function packages(): HasMany
    {
        return $this->hasMany(Package::class);
    }

    /** @return HasMany<Company, $this> */
    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }
}
