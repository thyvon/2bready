<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Company\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Company */
class CompanyResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_kh' => $this->name_kh,
            'registration_no' => $this->registration_no,
            'employee_count' => $this->employee_count,
            'bypass_flags' => $this->bypass_flags,
            'industry_id' => $this->industry_id,
            'industry_code' => $this->whenLoaded('industry', fn () => $this->industry?->code),
            'country_code' => $this->country_code,
            'status' => $this->status,
            'compliance_score' => $this->compliance_score,
            'default_locale' => $this->default_locale,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
