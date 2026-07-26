<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Enums;

enum TpHirePayoutStatus: string
{
    case Unpaid = 'unpaid';
    case PaidOut = 'paid_out';
}
