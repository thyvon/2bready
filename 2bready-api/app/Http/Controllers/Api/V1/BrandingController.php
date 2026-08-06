<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\Shared\Services\BrandingService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Settings\UploadLogoRequest;
use App\Http\Resources\Api\V1\PlatformSettingResource;
use App\Support\ApiResponse;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BrandingController extends Controller
{
    /**
     * PUBLIC — every portal (admin, client, TP, marketing) shows the
     * platform logo, and none of them share a permission level. The URL is
     * a fresh short-lived signed URL; null when no logo is uploaded yet.
     */
    #[Response(type: 'array{data: array{url: string|null}, meta: string}')]
    public function logo(BrandingService $branding): JsonResponse
    {
        return ApiResponse::success(['url' => $branding->logoUrl()]);
    }

    #[Response(type: 'array{data: array{url: string|null, setting: App\Http\Resources\Api\V1\PlatformSettingResource}, meta: string}')]
    public function uploadLogo(UploadLogoRequest $request, BrandingService $branding): JsonResponse
    {
        $setting = $branding->uploadLogo($request->file('logo'), $request->user());

        event(new AuditableActionOccurred(
            action: 'settings.branding_logo_uploaded',
            actorId: $request->user()->id,
            actorEmail: $request->user()->email,
        ));

        return ApiResponse::success([
            'url' => $branding->logoUrl(),
            'setting' => new PlatformSettingResource($setting),
        ]);
    }

    public function deleteLogo(BrandingService $branding): JsonResponse
    {
        $user = Auth::user();

        $branding->deleteLogo($user);

        event(new AuditableActionOccurred(
            action: 'settings.branding_logo_removed',
            actorId: $user->id,
            actorEmail: $user->email,
        ));

        return ApiResponse::noContent();
    }
}
