<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopCompany;
use App\Domain\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Sop */
class SopResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'version' => $this->version,
            'content_en' => $this->content_en,
            'content_kh' => $this->content_kh,
            'effective_at' => $this->effective_at?->toISOString(),
            'is_active' => $this->is_active,
            'is_global' => $this->company_id === null,
            'company' => $this->whenLoaded('company', function () {
                /** @var Company $company */
                $company = $this->company;

                return ['id' => $company->id, 'name' => $company->name];
            }),
            'created_by' => $this->whenLoaded('createdBy', function () {
                /** @var User $createdBy */
                $createdBy = $this->createdBy;

                return ['id' => $createdBy->id, 'name' => $createdBy->name];
            }),
            'adoptions' => $this->whenLoaded('adoptions', function () {
                /** @var Collection<int, SopCompany> $adoptions */
                $adoptions = $this->adoptions;

                return $adoptions->map(function (SopCompany $adoption): array {
                    return [
                        'id' => $adoption->id,
                        'company' => [
                            'id' => $adoption->company->id,
                            'name' => $adoption->company->name,
                        ],
                        'override_content_en' => $adoption->override_content_en,
                        'override_content_kh' => $adoption->override_content_kh,
                        'adopted_at' => $adoption->adopted_at->toISOString(),
                        'adopted_by' => $adoption->adoptedBy ? [
                            'id' => $adoption->adoptedBy->id,
                            'name' => $adoption->adoptedBy->name,
                        ] : null,
                    ];
                })->all();
            }),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
