<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Audit\Models\Audit;
use App\Domain\Company\Models\Company;
use App\Domain\Marketplace\Models\TpHire;
use App\Domain\TpPartner\Models\Auditor;
use App\Domain\TpPartner\Models\TpPartner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Audit */
class AuditResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company' => $this->whenLoaded('company', function () {
                /** @var Company $company */
                $company = $this->company;

                return ['id' => $company->id, 'name' => $company->name];
            }),
            'tp_hire_id' => $this->tp_hire_id,
            'tp_hire' => $this->whenLoaded('tpHire', function () {
                /** @var TpHire $tpHire */
                $tpHire = $this->tpHire;

                return [
                    'id' => $tpHire->id,
                    'status' => $tpHire->status,
                    'tp_partner_id' => $tpHire->tp_partner_id,
                ];
            }),
            'tp_partner' => $this->whenLoaded('tpPartner', function () {
                /** @var TpPartner $tpPartner */
                $tpPartner = $this->tpPartner;

                return ['id' => $tpPartner->id, 'name' => $tpPartner->name];
            }),
            'auditor_id' => $this->auditor_id,
            'auditor' => $this->whenLoaded('auditor', function () {
                /** @var Auditor $auditor */
                $auditor = $this->auditor;

                return [
                    'id' => $auditor->id,
                    'name' => $auditor->user?->name,
                ];
            }),
            'journey_level' => $this->journey_level,
            'status' => $this->status,
            'score' => $this->score,
            'feedback' => $this->feedback,
            'deadline' => $this->deadline?->toISOString(),
            'assigned_at' => $this->assigned_at?->toISOString(),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->pluck('id')),
            'created_at' => $this->created_at,
        ];
    }
}
