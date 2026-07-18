<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\User\Actions\CreateInternalUserAction;
use App\Domain\User\Actions\UpdateUserAction;
use App\Domain\User\DTOs\CreateUserData;
use App\Domain\User\Models\User;
use App\Domain\User\QueryFilters\UserFilters;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\User\StoreUserRequest;
use App\Http\Requests\Api\V1\User\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Internal staff (admin/staff/finance/auditor) only — admin-portal is
 * back-office only, company_owner/company_member accounts never appear or
 * get created here (client-portal's own scope).
 */
class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $perPage = min(100, max(5, (int) $request->input('per_page', 25)));
        $filters = $request->only(['role', 'status', 'search']);

        $users = UserFilters::apply(
            User::query()->whereHas('roles', fn ($q) => $q->whereIn('name', User::INTERNAL_ROLES))->with(['roles', 'companies']),
            $filters,
        )->latest()->paginate($perPage);

        return ApiResponse::success(
            UserResource::collection($users->items()),
            ['pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ]],
        );
    }

    public function show(User $user): JsonResponse
    {
        abort_unless($user->hasAnyRole(User::INTERNAL_ROLES), 404);
        $this->authorize('view', $user);

        return ApiResponse::success(new UserResource($user->load(['roles', 'companies'])));
    }

    public function store(StoreUserRequest $request, CreateInternalUserAction $action): JsonResponse
    {
        $this->authorize('create', User::class);

        $user = $action->execute(CreateUserData::from($request->validated()));

        return ApiResponse::created(new UserResource($user->load('roles')));
    }

    public function update(UpdateUserRequest $request, User $user, UpdateUserAction $action): JsonResponse
    {
        abort_unless($user->hasAnyRole(User::INTERNAL_ROLES), 404);
        $this->authorize('update', $user);

        $user = $action->execute($user, $request->validated());

        return ApiResponse::success(new UserResource($user->load('roles')));
    }
}
