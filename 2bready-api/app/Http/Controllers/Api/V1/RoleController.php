<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\RoleResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;

/**
 * Read-only and informational — the 6 roles are fixed, seeded by
 * RolePermissionSeeder, not editable through the API. No dedicated
 * RolePolicy: gated on the same user.manage permission as user management
 * itself, since "can see the permission model" isn't a separate capability
 * worth its own permission entry.
 */
class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $roles = Role::query()->with('permissions')->orderBy('name')->get();

        return ApiResponse::success(RoleResource::collection($roles));
    }
}
