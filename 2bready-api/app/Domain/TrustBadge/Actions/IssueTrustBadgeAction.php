<?php

declare(strict_types=1);

namespace App\Domain\TrustBadge\Actions;

use App\Domain\Audit\Models\Audit;
use App\Domain\Journey\Models\Journey;
use App\Domain\TrustBadge\Exceptions\BadgeIssuanceException;
use App\Domain\TrustBadge\Models\TrustBadge;
use App\Domain\User\Models\User;

/**
 * Issues a trust badge for an approved audit (v3 §1.6) — the company has
 * earned the audited level, and this is the record that later gets a
 * certificate. Resolves the journey_level_id by matching the audit's
 * denormalized level code against the company's journey template (same
 * resolution as ComplianceScoreService), so the badge always points at the
 * real taxonomy row. Idempotent-ish: a duplicate (audit, level) pair is
 * rejected by the unique index rather than silently creating a second badge.
 */
class IssueTrustBadgeAction
{
    public function execute(Audit $audit, User $issuedBy): TrustBadge
    {
        $journey = Journey::query()->withoutGlobalScope('company')
            ->where('company_id', $audit->company_id)
            ->first();

        $journeyLevelId = null;

        if ($journey) {
            $level = $journey->journeyTemplate->levels()
                ->where('code', $audit->journey_level)
                ->first();

            $journeyLevelId = $level?->id;
        }

        if ($journeyLevelId === null) {
            throw new BadgeIssuanceException(
                sprintf('Cannot issue a badge: no journey level "%s" for audit %s.', $audit->journey_level, $audit->id),
            );
        }

        return TrustBadge::query()->withoutGlobalScope('company')->create([
            'company_id' => $audit->company_id,
            'journey_level_id' => $journeyLevelId,
            'audit_id' => $audit->id,
            'level' => $audit->journey_level,
            'issued_at' => now(),
            'issued_by' => $issuedBy->id,
        ]);
    }
}
