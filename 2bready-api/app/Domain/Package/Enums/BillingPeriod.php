<?php

declare(strict_types=1);

namespace App\Domain\Package\Enums;

enum BillingPeriod: string
{
    case Monthly = 'monthly';
    case Yearly = 'yearly';
    case OneTime = 'one_time';
}
