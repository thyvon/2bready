<?php

declare(strict_types=1);

namespace App\Domain\Support\Models;

use App\Domain\Support\Enums\SupportTicketCategory;
use App\Domain\Support\Enums\SupportTicketStatus;
use App\Domain\User\Models\User;
use App\Support\Concerns\Auditable;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\SupportTicketFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $company_id
 * @property string $created_by
 * @property string|null $assigned_to
 * @property SupportTicketCategory $category
 * @property SupportTicketStatus $status
 *
 * A company's support conversation with the 2bReady team. The thread itself
 * lives in SupportTicketMessage rows; this model carries only routing state
 * (status, category, assignee).
 *
 * Uses the blanket BelongsToCompany scope (unlike Sop, which is global
 * template data) — a ticket is always one company's private conversation.
 */
class SupportTicket extends Model
{
    /** @use HasFactory<SupportTicketFactory> */
    use Auditable, BelongsToCompany, HasFactory, HasUlid;

    protected static function newFactory(): SupportTicketFactory
    {
        return SupportTicketFactory::new();
    }

    protected $fillable = [
        'company_id',
        'created_by',
        'assigned_to',
        'category',
        'subject',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'category' => SupportTicketCategory::class,
            'status' => SupportTicketStatus::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /** @return HasMany<SupportTicketMessage, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class)->oldest();
    }
}
