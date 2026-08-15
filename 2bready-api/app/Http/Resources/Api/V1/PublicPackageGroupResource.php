<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Package\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One journey-level package as seen by anonymous visitors (landing page
 * pricing). Each level is a single card, not one row per billing period —
 * the monthly and yearly prices live in the nested `prices` array. The
 * representative Package row (the yearly one, falling back to whatever
 * exists) supplies the identity/name/tier; `prices` carries every active
 * billing period for the level, each with its own id so a visitor can
 * subscribe to a specific cadence.
 *
 * The linked journey level's own display data rides along: its pathway name,
 * pillar, and milestones — the level's real compliance areas the landing card
 * renders as its feature checklist (the same data the client billing card
 * shows). The audit fee is the TP firm's charge for the level's manual audit.
 *
 * Deliberately narrower than PackageResource — no timestamps, soft-delete
 * state, or other internal metadata.
 *
 * @mixin Package
 */
class PublicPackageGroupResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_kh' => $this->name_kh,
            'description' => $this->description,
            'audit_fee_cents' => $this->audit_fee_cents,
            'industry_code' => $this->whenLoaded('industry', fn () => $this->industry?->code),
            'journey_level_code' => $this->whenLoaded('journeyLevel', fn () => $this->journeyLevel?->code),
            'pathway_name' => $this->whenLoaded('journeyLevel', fn () => $this->journeyLevel?->pathway_name),
            'pillar' => $this->whenLoaded('journeyLevel', fn () => $this->journeyLevel?->pillar),
            'milestones' => $this->whenLoaded('journeyLevel', fn () => MilestoneResource::collection($this->journeyLevel->milestones ?? collect())),            'tier' => $this->tier,
            'sort_order' => $this->sort_order,
            'prices' => PublicPackagePriceResource::collection($this->whenLoaded('prices', $this->prices ?? collect())),
        ];
    }
}
