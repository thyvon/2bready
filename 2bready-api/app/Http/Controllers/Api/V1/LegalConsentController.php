<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\LegalConsent\Actions\RecordLegalConsentAction;
use App\Domain\LegalConsent\Services\LegalConsentAccessService;
use App\Domain\LegalConsent\Services\LegalConsentService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LegalConsent\AcceptLegalConsentRequest;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Client-side legal consent (v3 §4.2/§5.1): the company user reads the
 * current consent text and accepts it before acting on restricted P3/P4
 * (L3/L4) documents. status returns whether consent is needed + the versioned
 * text (both locales) so the frontend can render the modal without
 * hardcoding legal copy; accept records it (legal_consents + audit_logs).
 * Gating itself is enforced server-side in DocumentPolicy::view / Upload
 * DocumentAction — these endpoints just drive the UI.
 */
class LegalConsentController extends Controller
{
    public function status(Request $request, LegalConsentService $service, LegalConsentAccessService $access): JsonResponse
    {
        $company = Company::query()->findOrFail($request->user()->current_company_id);
        $pathway = $service->pathwayForLevel($request->string('journey_level')->toString());

        return ApiResponse::success([
            'consent_required' => $pathway !== null,
            'accepted' => $pathway !== null && $access->hasAcceptedForPathway($request->user(), $company, $pathway),
            'version' => $service->currentVersion(),
            'text_en' => $service->textEn(),
            'text_kh' => $service->textKh(),
        ]);
    }

    public function accept(AcceptLegalConsentRequest $request, LegalConsentService $service, RecordLegalConsentAction $action): JsonResponse
    {
        $company = Company::query()->findOrFail($request->user()->current_company_id);
        $pathway = $service->pathwayForLevel($request->validated('journey_level'));

        if (! $pathway) {
            return ApiResponse::success([
                'accepted' => true,
                'version' => $service->currentVersion(),
            ]);
        }

        $consent = $action->execute($request->user(), $company, $pathway, $request->ip());

        return ApiResponse::created([
            'accepted' => true,
            'version' => $consent->consent_text_version,
        ]);
    }
}
