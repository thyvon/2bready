<?php

declare(strict_types=1);

namespace App\Domain\Document\Enums;

enum DocumentStatus: string
{
    case PendingScan = 'pending_scan';
    case ScanFailed = 'scan_failed';
    case Review = 'review';
    case Verified = 'verified';
    case Rejected = 'rejected';
    case Expired = 'expired';
}
