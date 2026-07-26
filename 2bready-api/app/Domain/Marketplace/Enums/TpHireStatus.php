<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Enums;

enum TpHireStatus: string
{
    case PendingPayment = 'pending_payment';
    case Active = 'active';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
