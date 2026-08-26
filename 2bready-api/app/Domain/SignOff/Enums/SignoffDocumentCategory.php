<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Enums;

enum SignoffDocumentCategory: string
{
    case Sales = 'sales';
    case Marketing = 'marketing';
    case Finance = 'finance';
    case Production = 'production';
    case Hr = 'hr';
    case Other = 'other';
}
