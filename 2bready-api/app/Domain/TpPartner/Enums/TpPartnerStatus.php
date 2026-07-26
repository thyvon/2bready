<?php

declare(strict_types=1);

namespace App\Domain\TpPartner\Enums;

enum TpPartnerStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
}
