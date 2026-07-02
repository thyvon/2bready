<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\User\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'locale' => $this->locale,
            'status' => $this->status,
            'company_id' => $this->company_id,
            'roles' => $this->getRoleNames(),
            'email_verified_at' => $this->email_verified_at,
            'totp_enabled' => $this->hasTwoFactorEnabled(),
            'totp_required' => $this->requiresTwoFactor(),
            'created_at' => $this->created_at,
        ];
    }
}
