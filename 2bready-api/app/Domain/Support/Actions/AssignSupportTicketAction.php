<?php

declare(strict_types=1);

namespace App\Domain\Support\Actions;

use App\Domain\Support\Models\SupportTicket;
use App\Domain\User\Models\User;

/** Internal-only: route a ticket to (or away from) a team member. */
class AssignSupportTicketAction
{
    public function execute(SupportTicket $ticket, ?User $assignee): SupportTicket
    {
        $ticket->update(['assigned_to' => $assignee?->id]);

        return $ticket->fresh();
    }
}
