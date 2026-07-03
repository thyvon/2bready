<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Shared\Services\PlatformSettingService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Settings\UpdatePlatformSettingRequest;
use App\Http\Resources\Api\V1\PlatformSettingResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlatformSettingController extends Controller
{
    public function index(PlatformSettingService $settings): JsonResponse
    {
        return ApiResponse::success(PlatformSettingResource::collection($settings->all()));
    }

    public function update(
        string $key,
        UpdatePlatformSettingRequest $request,
        PlatformSettingService $settings,
    ): JsonResponse {
        $setting = $settings->set(
            $key,
            $request->validated('value'),
            $request->validated('group') ?? 'general',
            $request->user(),
        );

        return ApiResponse::success(new PlatformSettingResource($setting));
    }
}
