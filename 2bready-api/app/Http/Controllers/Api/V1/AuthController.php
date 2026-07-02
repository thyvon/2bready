<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\User\Actions\ConfirmTotpAction;
use App\Domain\User\Actions\RegisterUserAction;
use App\Domain\User\Actions\SetupTotpAction;
use App\Domain\User\Actions\VerifyTotpAction;
use App\Domain\User\DTOs\RegisterUserData;
use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\ForgotPasswordRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\ResetPasswordRequest;
use App\Http\Requests\Api\V1\Auth\TotpVerifyRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, RegisterUserAction $action): JsonResponse
    {
        $user = $action->execute(RegisterUserData::from($request->validated()));

        $token = $user->createToken('api')->plainTextToken;

        return ApiResponse::created([
            'user' => new UserResource($user),
            'token' => $token,
            'totp_required' => false,
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->isActive()) {
            Auth::logout();

            return ApiResponse::error('Your account has been suspended.', [], 403);
        }

        // If 2FA is required but not confirmed, prompt for setup
        if ($user->requiresTwoFactor() && ! $user->hasTwoFactorEnabled()) {
            $token = $user->createToken('api')->plainTextToken;

            return ApiResponse::success([
                'user' => new UserResource($user),
                'token' => $token,
                'totp_required' => true,
                'totp_confirmed' => false,
            ], [], 200);
        }

        // If 2FA is set up, require the code before issuing the token
        if ($user->hasTwoFactorEnabled()) {
            $token = $user->createToken('api-pending-totp')->plainTextToken;

            return ApiResponse::success([
                'user' => new UserResource($user),
                'token' => $token,
                'totp_required' => true,
                'totp_confirmed' => true,
            ], [], 200);
        }

        $token = $user->createToken('api')->plainTextToken;

        return ApiResponse::success([
            'user' => new UserResource($user),
            'token' => $token,
            'totp_required' => false,
        ], [], 200);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(new UserResource($request->user()), [], 200);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        // Always return 200 — never leak whether the email exists
        return ApiResponse::success(['message' => 'If that email exists, a reset link has been sent.'], [], 200);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();
                $user->tokens()->delete();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return ApiResponse::error(__($status), [], 422);
        }

        return ApiResponse::success(['message' => __($status)], [], 200);
    }

    public function totpSetup(Request $request, SetupTotpAction $action): JsonResponse
    {
        $data = $action->execute($request->user());

        return ApiResponse::success($data, [], 200);
    }

    public function totpConfirm(TotpVerifyRequest $request, ConfirmTotpAction $action): JsonResponse
    {
        $confirmed = $action->execute($request->user(), $request->validated('code'));

        if (! $confirmed) {
            return ApiResponse::error('Invalid verification code.', ['code' => ['The code is incorrect or expired.']], 422);
        }

        return ApiResponse::success(['message' => 'Two-factor authentication enabled.'], [], 200);
    }

    public function totpVerify(TotpVerifyRequest $request, VerifyTotpAction $action): JsonResponse
    {
        $valid = $action->execute($request->user(), $request->validated('code'));

        if (! $valid) {
            return ApiResponse::error('Invalid verification code.', ['code' => ['The code is incorrect or expired.']], 422);
        }

        // Revoke pending token, issue a clean one
        $request->user()->currentAccessToken()->delete();
        $token = $request->user()->createToken('api')->plainTextToken;

        return ApiResponse::success([
            'token' => $token,
            'message' => 'Two-factor authentication verified.',
        ], [], 200);
    }
}
