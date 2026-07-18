<?php

declare(strict_types=1);

namespace App\Domain\Package\Models;

use App\Domain\Company\Models\Company;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\HasUlid;
use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** @use HasFactory<LeadFactory> */
class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use Auditable, HasFactory, HasUlid;

    /** @return Factory<Lead> */
    protected static function newFactory(): Factory
    {
        return LeadFactory::new();
    }

    protected $fillable = [
        'company_id',
        'name',
        'email',
        'phone',
        'company_name',
        'source',
    ];

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
