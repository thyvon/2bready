<?php

declare(strict_types=1);

namespace App\Domain\Journey\Enums;

enum MilestoneCompletionTrigger: string
{
    case DocumentUpload = 'document_upload';
    case AuditApproval = 'audit_approval';
    case AdminSignoff = 'admin_signoff';
}
