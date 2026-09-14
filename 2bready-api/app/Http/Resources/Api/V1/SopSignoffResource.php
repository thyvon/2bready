<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Sop\Models\Sop;
use App\Domain\Sop\Models\SopSignoff;
use App\Domain\User\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SopSignoff */
class SopSignoffResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sop_id' => $this->sop_id,
            'company_id' => $this->company_id,
            'sop' => $this->whenLoaded('sop', function () {
                /** @var Sop|null $sop */
                $sop = $this->sop;

                return $sop ? ['id' => $sop->id, 'title' => $sop->title, 'version' => $sop->version] : null;
            }),
            'user' => $this->whenLoaded('user', function () {
                /** @var User|null $user */
                $user = $this->user;

                return $user ? ['id' => $user->id, 'name' => $user->name] : null;
            }),
            'signed_at' => $this->signed_at?->toISOString(),
            'sent_by' => $this->whenLoaded('sentBy', function () {
                /** @var User|null $sentBy */
                $sentBy = $this->sentBy;

                return $sentBy ? ['id' => $sentBy->id, 'name' => $sentBy->name] : null;
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
