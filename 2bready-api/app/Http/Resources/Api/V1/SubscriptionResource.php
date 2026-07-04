<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Payment\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Subscription */
class SubscriptionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'package' => new PackageResource($this->whenLoaded('package')),
            'status' => $this->status,
            'started_at' => $this->started_at,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
        ];
    }
}
