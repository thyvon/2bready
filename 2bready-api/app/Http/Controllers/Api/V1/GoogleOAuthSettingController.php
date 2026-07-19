<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\Shared\Services\GoogleOAuthSettingService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Settings\UpdateGoogleOAuthSettingRequest;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

// settings.manage-gated (routes/api/settings.php) — admin only, mirrors the
// generic PlatformSettingController's permission boundary but with its own
// controller since the secret needs encryption + must never be returned
// in plaintext (see GoogleOAuthSettingService's docblock for why this isn't
// just another PlatformSetting key handled generically).
class GoogleOAuthSettingController extends Controller
{
    public function show(GoogleOAuthSettingService $service): JsonResponse
    {
        return ApiResponse::success([
            'enabled' => $service->isEnabled(),
            'client_id' => $service->clientId(),
            'client_secret_configured' => $service->hasClientSecret(),
        ]);
    }

    public function update(UpdateGoogleOAuthSettingRequest $request, GoogleOAuthSettingService $service): JsonResponse
    {
        $service->save(
            enabled: $request->boolean('enabled'),
            clientId: (string) $request->validated('client_id'),
            clientSecret: $request->validated('client_secret'),
            updatedBy: $request->user(),
        );

        event(new AuditableActionOccurred(
            action: 'settings.google_oauth_updated',
            actorId: $request->user()->id,
            actorEmail: $request->user()->email,
            metadata: ['enabled' => $request->boolean('enabled')],
        ));

        return ApiResponse::success([
            'enabled' => $service->isEnabled(),
            'client_id' => $service->clientId(),
            'client_secret_configured' => $service->hasClientSecret(),
        ]);
    }
}
