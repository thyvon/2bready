<?php

declare(strict_types=1);

namespace App\Domain\Support\Actions;

use App\Domain\Support\Enums\SupportTicketStatus;
use App\Domain\Support\Models\SupportTicket;
use App\Domain\Support\Models\SupportTicketMessage;
use App\Domain\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Adds a reply to a thread and advances the status:
 *  - team reply → pending (ball back in the company's court)
 *  - company reply on pending/resolved → open (back in the team's court)
 *  - company reply on open → stays open
 * Closed tickets never reach this action — the policy blocks them first.
 */
class ReplySupportTicketAction
{
    public function execute(SupportTicket $ticket, User $author, string $message): SupportTicketMessage
    {
        return DB::transaction(function () use ($ticket, $author, $message): SupportTicketMessage {
            $reply = SupportTicketMessage::create([
                'support_ticket_id' => $ticket->id,
                // Always the ticket's own company — keeps the blanket tenant
                // scope on messages consistent even when the author is
                // internal (no current_company_id of their own).
                'company_id' => $ticket->company_id,
                'user_id' => $author->id,
                'message' => $message,
            ]);

            $isTeamReply = $author->can('support.manage');

            $newStatus = match (true) {
                $isTeamReply && $ticket->status === SupportTicketStatus::Open => SupportTicketStatus::Pending,
                ! $isTeamReply && in_array($ticket->status, [SupportTicketStatus::Pending, SupportTicketStatus::Resolved], true) => SupportTicketStatus::Open,
                default => null,
            };

            if ($newStatus !== null) {
                $ticket->update(['status' => $newStatus]);
            }

            return $reply;
        });
    }
}
