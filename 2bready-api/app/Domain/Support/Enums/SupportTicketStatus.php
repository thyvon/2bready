<?php

declare(strict_types=1);

namespace App\Domain\Support\Enums;

enum SupportTicketStatus: string
{
    /** Freshly created, nobody from the team replied yet. */
    case Open = 'open';
    /** The team replied — waiting on the company. */
    case Pending = 'pending';
    /** The team considers it solved; company may reopen by replying. */
    case Resolved = 'resolved';
    /** Terminal — no further replies accepted from either side. */
    case Closed = 'closed';
}
