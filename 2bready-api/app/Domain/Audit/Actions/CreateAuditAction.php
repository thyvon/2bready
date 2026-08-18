<?php

declare(strict_types=1);

namespace App\Domain\Audit\Actions;

use App\Domain\Audit\DTOs\AuditData;
use App\Domain\Audit\Enums\AuditStatus;
use App\Domain\Audit\Models\Audit;
use App\Domain\Marketplace\Models\TpHire;
use App\Exceptions\AuditAlreadyExistsException;
use App\Exceptions\HireNotAuditableException;

/**
 * Admin creates an audit against an existing TpHire. The hire carries the
 * company, the hired firm and the journey level, so the audit inherits all
 * three — status starts pending, awaiting auditor assignment. Only
 * completed or active hires are auditable: a pending-payment or cancelled
 * hire funds no review.
 */
class CreateAuditAction
{
    public function execute(AuditData $data): Audit
    {
        $tpHire = TpHire::query()->withoutGlobalScope('company')->findOrFail($data->tp_hire_id);

        if (in_array($tpHire->status->value, ['pending_payment', 'cancelled'], true)) {
            throw new HireNotAuditableException;
        }

        if (Audit::query()->withoutGlobalScope('company')->where('tp_hire_id', $tpHire->id)->exists()) {
            throw new AuditAlreadyExistsException;
        }

        return Audit::create([
            'company_id' => $tpHire->company_id,
            'tp_hire_id' => $tpHire->id,
            'journey_level' => $tpHire->journey_level,
            'status' => AuditStatus::Pending,
            'deadline' => $data->deadline,
        ]);
    }
}
