<?php

declare(strict_types=1);

namespace App\Domain\Marketplace\Actions;

use App\Domain\Marketplace\Enums\TpHireStatus;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Exceptions\HireNotCancellableException;

/**
 * The marketplace unhire flow. A company_owner may cancel a hire that has
 * not finished:
 *
 * - pending_payment → the engagement never started; the attached payment is
 *   marked failed (only while it is still pending/awaiting_confirmation —
 *   a confirmed payment means money already moved and is out of scope here).
 * - active → the TP firm loses access to the company's journey immediately
 *   (TpAssignmentController only ever lists status=active hires).
 *
 * completed/cancelled hires are terminal — throwing keeps the history
 * honest and mirrors CompleteTpHireAction's "manual for v1" stance.
 */
class CancelTpHireAction
{
    public function execute(TpHire $tpHire): TpHire
    {
        if (! in_array($tpHire->status, [TpHireStatus::PendingPayment, TpHireStatus::Active], true)) {
            throw new HireNotCancellableException;
        }

        $tpHire->update([
            'status' => TpHireStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        $this->failOpenPayments($tpHire);

        return $tpHire;
    }

    /**
     * A hire's payment must never be confirmable after cancellation.
     * Confirmed payments are untouched (money already moved) — only
     * payments still in flight get marked failed, so a late admin confirm
     * cannot resurrect the hire (see ActivateTpHireAction's guard).
     */
    private function failOpenPayments(TpHire $tpHire): void
    {
        $tpHire->payments()
            ->whereIn('status', [PaymentStatus::Pending, PaymentStatus::AwaitingConfirmation])
            ->update(['status' => PaymentStatus::Failed]);
    }
}
