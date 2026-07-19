<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\AuditLog\Events\AuditableActionOccurred;
use App\Domain\Shared\Mail\MailSettingTestMail;
use App\Domain\Shared\Services\MailSettingService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Settings\UpdateMailSettingRequest;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

// settings.manage-gated (routes/api/settings.php) — mirrors
// GoogleOAuthSettingController exactly: the password needs to be encrypted
// at rest and must never be returned to the frontend in plaintext.
class MailSettingController extends Controller
{
    public function show(MailSettingService $service): JsonResponse
    {
        return ApiResponse::success($this->present($service));
    }

    public function update(UpdateMailSettingRequest $request, MailSettingService $service): JsonResponse
    {
        $service->save(
            host: (string) $request->validated('host'),
            port: (int) $request->validated('port'),
            username: $request->validated('username'),
            password: $request->validated('password'),
            encryption: $request->validated('encryption'),
            fromAddress: (string) $request->validated('from_address'),
            fromName: (string) $request->validated('from_name'),
            updatedBy: $request->user(),
        );

        event(new AuditableActionOccurred(
            action: 'settings.mail_updated',
            actorId: $request->user()->id,
            actorEmail: $request->user()->email,
        ));

        return ApiResponse::success($this->present($service));
    }

    public function test(Request $request, MailSettingService $service): JsonResponse
    {
        abort_unless($service->isConfigured(), 422, 'Save your mail settings before sending a test email.');

        $service->applyRuntimeConfig();

        try {
            Mail::to($request->user()->email)->send(new MailSettingTestMail);
        } catch (Throwable $e) {
            Log::warning('Mail settings test send failed', ['error' => $e->getMessage()]);

            return ApiResponse::error('Could not send the test email: '.$e->getMessage());
        }

        return ApiResponse::success(['message' => 'Test email sent to '.$request->user()->email.'.']);
    }

    /** @return array<string, mixed> */
    private function present(MailSettingService $service): array
    {
        return [
            'host' => $service->host(),
            'port' => $service->port(),
            'username' => $service->username(),
            'encryption' => $service->encryption(),
            'from_address' => $service->fromAddress(),
            'from_name' => $service->fromName(),
            'password_configured' => $service->hasPassword(),
        ];
    }
}
