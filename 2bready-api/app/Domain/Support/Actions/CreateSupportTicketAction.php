<?php

declare(strict_types=1);

namespace App\Domain\Support\Actions;

use App\Domain\Company\Models\Company;
use App\Domain\Support\Enums\SupportTicketCategory;
use App\Domain\Support\Enums\SupportTicketStatus;
use App\Domain\Support\Models\SupportTicket;
use App\Domain\Support\Models\SupportTicketMessage;
use App\Domain\User\Models\User;

/**
 * Opens a ticket with its first message in one go — the opening post IS the
 * thread, so both rows are written together or not at all.
 */
class CreateSupportTicketAction
{
    public function execute(Company $company, User $creator, string $category, string $subject, string $message): SupportTicket
    {
        $ticket = SupportTicket::create([
            'company_id' => $company->id,
            'created_by' => $creator->id,
            'category' => SupportTicketCategory::from($category),
            'subject' => $subject,
            'status' => SupportTicketStatus::Open,
        ]);

        SupportTicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'company_id' => $company->id,
            'user_id' => $creator->id,
            'message' => $message,
        ]);

        return $ticket->load(['messages', 'creator', 'assignee']);
    }
}
