<?php

declare(strict_types=1);

namespace App\Domain\Payment\Models;

use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\User\Models\User;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $amount_cents
 * @property PaymentMethod $method
 * @property PaymentStatus $status
 *
 * @use HasFactory<PaymentFactory>
 */
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use Auditable, BelongsToCompany, HasFactory, HasUlid;

    /** @return Factory<Payment> */
    protected static function newFactory(): Factory
    {
        return PaymentFactory::new();
    }

    protected $fillable = [
        'company_id',
        'payable_id',
        'payable_type',
        'amount_cents',
        'currency',
        'method',
        'status',
        'gateway_reference',
        'submitted_at',
        'confirmed_by',
        'confirmed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'method' => PaymentMethod::class,
            'status' => PaymentStatus::class,
            'submitted_at' => 'datetime',
            'confirmed_at' => 'datetime',
        ];
    }

    /** @return MorphTo<Model, $this> */
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return BelongsTo<User, $this> */
    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }
}
