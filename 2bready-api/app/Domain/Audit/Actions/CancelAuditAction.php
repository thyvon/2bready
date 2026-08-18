<?php

declare(strict_types=1);

namespace App\Domain\Audit\Actions;

use App\Domain\Audit\Enums\AuditStatus;
use App\Domain\Audit\Models\Audit;
use App\Exceptions\AuditNotCancellableException;

/**
 * Admin cancels a pending or in-progress audit — e.g. the hire was voided,
 * or the wrong firm/level was set up. Cancellation is the explicit terminal
 * state (ERD: no soft deletes on compliance records); once an audit has been
 * submitted it can only be resolved by a review, not cancelled.
 */
class CancelAuditAction
{
    public function execute(Audit $audit): Audit
    {
        if (! in_array($audit->status, [AuditStatus::Pending, AuditStatus::InProgress], true)) {
            throw new AuditNotCancellableException;
        }

        $audit->update([
            'status' => AuditStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        return $audit;
    }
}
