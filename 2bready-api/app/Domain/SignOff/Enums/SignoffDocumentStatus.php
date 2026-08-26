<?php

declare(strict_types=1);

namespace App\Domain\SignOff\Enums;

enum SignoffDocumentStatus: string
{
    /** Uploaded, awaiting platform review. */
    case PendingReview = 'pending_review';
    /** Verified by an internal expert — may be sent to staff. */
    case Verified = 'verified';
    /** Rejected with a comment; owner can re-upload a corrected file. */
    case Rejected = 'rejected';
}
