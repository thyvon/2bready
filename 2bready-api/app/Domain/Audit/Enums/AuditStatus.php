<?php

declare(strict_types=1);

namespace App\Domain\Audit\Enums;

enum AuditStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
}
