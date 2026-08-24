<?php

declare(strict_types=1);

namespace App\Domain\Support\Models;

use App\Domain\User\Models\User;
use App\Support\Concerns\BelongsToCompany;
use App\Support\Concerns\HasUlid;
use Database\Factories\SupportTicketMessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo as TicketRelation;

/**
 * @property string $id
 * @property string $support_ticket_id
 * @property string $company_id
 * @property string $user_id
 * @property string $message
 *
 * One reply in a support thread. Carries its own company_id (not just the
 * parent ticket's) so it can use the blanket BelongsToCompany scope like
 * every other tenant-scoped row — Rule #1.
 */
class SupportTicketMessage extends Model
{
    /** @use HasFactory<SupportTicketMessageFactory> */
    use BelongsToCompany, HasFactory, HasUlid;

    protected $fillable = [
        'support_ticket_id',
        'company_id',
        'user_id',
        'message',
    ];

    /** @return TicketRelation<SupportTicket, $this> */
    public function ticket(): TicketRelation
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
