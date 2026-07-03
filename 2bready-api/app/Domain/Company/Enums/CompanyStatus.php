<?php

declare(strict_types=1);

namespace App\Domain\Company\Enums;

enum CompanyStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case Inactive = 'inactive';
}
