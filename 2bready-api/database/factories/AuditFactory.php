<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Audit\Enums\AuditStatus;
use App\Domain\Audit\Models\Audit;
use App\Domain\Marketplace\Models\TpHire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Mirrors the createAudit() helper in AuditTest (audits have no unique
 * journey_level FK — they join the taxonomy by denormalized code). The audit
 * needs a real hire for the tp_hire_id FK, so the factory wires an active
 * TpHire unless overridden.
 *
 * @extends Factory<Audit>
 */
class AuditFactory extends Factory
{
    protected $model = Audit::class;

    public function definition(): array
    {
        $hire = TpHire::factory()->active()->create();

        return [
            'company_id' => $hire->company_id,
            'tp_hire_id' => $hire->id,
            'auditor_id' => null,
            'journey_level' => $hire->journey_level,
            'status' => AuditStatus::Pending,
            'score' => null,
            'feedback' => null,
            'deadline' => null,
            'assigned_at' => null,
            'submitted_at' => null,
            'reviewed_at' => null,
            'cancelled_at' => null,
        ];
    }
}
