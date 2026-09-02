<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\User\Actions\ChangeOwnPasswordAction;
use App\Domain\User\Actions\UpdateOwnProfileAction;
use App\Domain\User\DTOs\UpdateOwnProfileData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profile\ChangePasswordRequest;
use App\Http\Requests\Api\V1\Profile\UpdateProfileRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Generic self-service "manage my own account" — first instance of this
 * pattern in the codebase (admin-portal's profile page was read-only,
 * client-portal's settings was an unbuilt stub, password changes only
 * existed via the out-of-session forgot/reset email flow). Deliberately not
 * gated by any permission beyond authentication — every account type only
 * ever touches its own row here.
 */
class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request, UpdateOwnProfileAction $action): JsonResponse
    {
        $user = $action->execute($request->user(), UpdateOwnProfileData::from($request->validated()));

        return ApiResponse::success(new UserResource($user->fresh()->load('companies')));
    }

    public function changePassword(ChangePasswordRequest $request, ChangeOwnPasswordAction $action): JsonResponse
    {
        $changed = $action->execute(
            $request->user(),
            $request->validated('current_password'),
            $request->validated('password'),
        );

        if (! $changed) {
            return ApiResponse::error('Current password is incorrect.', ['current_password' => ['The current password is incorrect.']], 422);
        }

        return ApiResponse::success(['message' => 'Password changed. Please log in again.'], [], 200);
    }
}
