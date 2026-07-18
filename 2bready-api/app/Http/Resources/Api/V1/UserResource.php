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
            'current_company_id' => $this->current_company_id,
            // A user can belong to more than one company (§0.7 of the MVP proposal) —
            // the frontend's company switcher lists these, current_company_id says which
            // one is active. Lazy-loads if not already eager-loaded; this resource wraps
            // a single user, never a collection, so the extra query is a one-off, not N+1.
            'companies' => CompanyResource::collection($this->companies),
            'roles' => $this->getRoleNames(),
            // Backs each frontend's own belt-and-suspenders route gate (on top of
            // the real enforcement boundary, AuthController::login/adminLogin) —
            // lets both apps check one flag instead of re-deriving it from a
            // hardcoded role list. See User::canAccessAdminPortal/ClientPortal.
            'can_access_admin_portal' => $this->canAccessAdminPortal(),
            'can_access_client_portal' => $this->canAccessClientPortal(),
            'email_verified_at' => $this->email_verified_at,
            'totp_enabled' => $this->hasTwoFactorEnabled(),
            'totp_required' => $this->requiresTwoFactor(),
            'created_at' => $this->created_at,
        ];
    }
}
