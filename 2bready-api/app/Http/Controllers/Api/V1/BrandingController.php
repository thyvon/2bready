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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BrandingController extends Controller
{
    /**
     * PUBLIC — every portal (admin, client, TP, marketing) shows the
     * platform logo, and none of them share a permission level. The URLs are
     * fresh short-lived signed URLs, one per slot; null when a slot has no
     * logo uploaded yet.
     */
    #[Response(type: 'array{data: array{light: string|null, dark: string|null, footer: string|null, footerDark: string|null}, meta: string}')]
    public function branding(BrandingService $branding): JsonResponse
    {
        return ApiResponse::success($branding->brandingUrls());
    }

    /**
     * PUBLIC — kept for compatibility (the original single-logo endpoint).
     * New code should use GET /api/v1/branding, which returns all four
     * slots in one request.
     */
    #[Response(type: 'array{data: array{url: string|null}, meta: string}')]
    public function logo(BrandingService $branding): JsonResponse
    {
        return ApiResponse::success(['url' => $branding->logoUrl()]);
    }

    #[Response(type: 'array{data: array{url: string|null, setting: App\Http\Resources\Api\V1\PlatformSettingResource}, meta: string}')]
    public function uploadLogo(UploadLogoRequest $request, BrandingService $branding): JsonResponse
    {
        $slot = $request->input('slot', 'main');

        $setting = $branding->uploadLogo($request->file('logo'), $slot, $request->user());

        event(new AuditableActionOccurred(
            action: 'settings.branding_logo_uploaded',
            actorId: $request->user()->id,
            actorEmail: $request->user()->email,
            metadata: ['slot' => $slot],
        ));

        return ApiResponse::success([
            'url' => $branding->logoUrl($slot),
            'setting' => new PlatformSettingResource($setting),
        ]);
    }

    public function deleteLogo(Request $request, BrandingService $branding): JsonResponse
    {
        $user = Auth::user();
        $validated = $request->validate([
            'slot' => ['sometimes', 'string', Rule::in(BrandingService::slots())],
        ]);
        $slot = $validated['slot'] ?? 'main';

        $branding->deleteLogo($slot, $user);

        event(new AuditableActionOccurred(
            action: 'settings.branding_logo_removed',
            actorId: $user->id,
            actorEmail: $user->email,
            metadata: ['slot' => $slot],
        ));

        return ApiResponse::noContent();
    }
}
