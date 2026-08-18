<?php

declare(strict_types=1);

namespace App\Domain\Audit\Listeners;

use App\Domain\Audit\Events\AuditDecisionMade;
use App\Domain\Audit\Services\ComplianceScoreService;

/**
 * The only caller of ComplianceScoreService (Rule #3 — never called directly
 * from a Controller or Action). Listens for the approval event and applies
 * the score/milestone side effects.
 */
class UpdateComplianceScoreListener
{
    public function __construct(private readonly ComplianceScoreService $service) {}

    public function handle(AuditDecisionMade $event): void
    {
        $this->service->apply($event->audit);
    }
}
