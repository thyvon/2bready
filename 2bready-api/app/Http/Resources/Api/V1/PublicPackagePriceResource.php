<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Package\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One billable price option of a journey-level package. Public /pricing
 * groups each level's monthly + yearly Package rows under a single
 * PublicPackageGroupResource; this resource is one of those rows, carrying
 * its own id so a consumer can subscribe to that specific billing period.
 *
 * @mixin Package
 */
class PublicPackagePriceResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'billing_period' => $this->billing_period,
            'price_cents' => $this->price_cents,
        ];
    }
}
