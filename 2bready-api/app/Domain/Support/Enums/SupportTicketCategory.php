<?php

declare(strict_types=1);

namespace App\Domain\Support\Enums;

enum SupportTicketCategory: string
{
    case General = 'general';
    case Billing = 'billing';
    case Technical = 'technical';
    /** The landing/overview "Request Consultation" CTA feeds this category. */
    case Consultation = 'consultation';
}
