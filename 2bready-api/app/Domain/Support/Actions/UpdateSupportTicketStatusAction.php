<?php

declare(strict_types=1);

namespace App\Domain\Support\Actions;

use App\Domain\Support\Enums\SupportTicketStatus;
use App\Domain\Support\Models\SupportTicket;
use App\Domain\User\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Explicit status moves: resolve / close / reopen / pend.
 * The policy decides who may call this; the action guards which transitions
 * are legal so the lifecycle can't be jumped arbitrarily. Closed is terminal
 * for companies — only the team may reopen, and only back to open.
 */
class UpdateSupportTicketStatusAction
{
    public function execute(SupportTicket $ticket, string $status, User $actor): SupportTicket
    {
        $target = SupportTicketStatus::from($status);
        $isInternal = $actor->can('support.manage');

        if ($ticket->status === $target) {
            return $ticket; // idempotent no-op
        }

        if ($ticket->status === SupportTicketStatus::Closed && (! $isInternal || $target !== SupportTicketStatus::Open)) {
            throw ValidationException::withMessages([
                'status' => ['This ticket is closed.'],
            ]);
        }

        $ticket->update(['status' => $target]);

        return $ticket->fresh();
    }
}
