<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\DataRoom\Actions\VerifyDataRoomAccessAction;
use App\Domain\DataRoom\Exceptions\DataRoomLinkInvalidException;
use App\Domain\DataRoom\Exceptions\InvalidDataRoomPinException;
use App\Domain\Document\Actions\GeneratePreviewUrlAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\DataRoom\VerifyDataRoomAccessRequest;
use App\Http\Resources\Api\V1\PublicDataRoomDocumentResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * No auth:sanctum anywhere in this controller — a link token + PIN (and,
 * for previewUrl, the resulting view_session) IS the credential. See
 * VerifyDataRoomAccessAction's docblock for the audit-logging contract.
 */
class PublicDataRoomController extends Controller
{
    public function verify(string $token, VerifyDataRoomAccessRequest $request, VerifyDataRoomAccessAction $action): JsonResponse
    {
        try {
            $result = $action->execute($token, (string) $request->validated('pin'), (string) $request->ip());
        } catch (DataRoomLinkInvalidException $e) {
            return ApiResponse::error($e->getMessage(), [], 404);
        } catch (InvalidDataRoomPinException $e) {
            return ApiResponse::error($e->getMessage(), [], 403);
        }

        return ApiResponse::success([
            'view_session' => $result['view_session'],
            'company_name' => $result['company_name'],
            'documents' => PublicDataRoomDocumentResource::collection($result['documents']),
        ]);
    }

    public function previewUrl(
        string $token,
        string $document,
        Request $request,
        VerifyDataRoomAccessAction $verifyAction,
        GeneratePreviewUrlAction $previewAction,
    ): JsonResponse {
        $link = $verifyAction->resolveLinkForViewSession((string) $request->query('view_session'));

        // Both checks matter: the view_session must still be a live cache
        // entry AND must actually belong to the token in this URL — a
        // session minted for one data room must never resolve a document
        // via a different room's URL.
        if (! $link || $link->token !== $token || ! $link->isActive()) {
            return ApiResponse::error('This session has expired. Please re-enter the PIN.', [], 403);
        }

        $doc = $verifyAction->findShareableDocument($link->company_id, $document);

        abort_if($doc === null, 404);

        return ApiResponse::success([
            'url' => $previewAction->execute($doc),
            'mime_type' => $doc->mime_type,
            'original_filename' => $doc->original_filename,
        ]);
    }
}
