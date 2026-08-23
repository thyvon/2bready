<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Enums;

enum TpPartnerStatus: string
{
    case PendingApproval = 'pending_approval';
    case Active = 'active';
    case Suspended = 'suspended';
}
