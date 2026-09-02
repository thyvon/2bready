<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\SignOff\Actions\AcknowledgeSignoffDocumentUserAction;
use App\Domain\SignOff\Models\SignoffDocumentUser;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\SignoffDocumentResource;
use App\Http\Resources\Api\V1\SignoffDocumentUserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff-side signed-off documents: "what was shared with me" and the
 * acknowledge action. Rows are scoped to the logged-in user.
 */
class MySignoffDocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rows = SignoffDocumentUser::query()
            ->where('user_id', $request->user()->id)
            ->whereNotNull('emailed_at')
            ->with(['document.verifier'])
            ->latest()
            ->get();

        // Rows carry the per-user state (emailed/signed) plus the nested
        // document — the UI needs both.
        return ApiResponse::success(SignoffDocumentUserResource::collection($rows));
    }

    public function acknowledge(Request $request, string $signoffDocumentUserId, AcknowledgeSignoffDocumentUserAction $action): JsonResponse
    {
        /** @var SignoffDocumentUser|null $row */
        $row = SignoffDocumentUser::query()
            ->where('user_id', $request->user()->id)
            ->find($signoffDocumentUserId);

        if ($row === null) {
            return ApiResponse::error('Sign-off request not found.', [], 404);
        }

        // 404, not 403 — another user's row doesn't exist for this caller
        // (same convention as every other tenant-scoped miss).
        $row = $action->execute($row);

        $document = $row->document()->with('verifier')->first();

        return ApiResponse::success([
            'id' => $row->id,
            'signoff_document_id' => $row->signoff_document_id,
            'signed_at' => $row->signed_at?->toISOString(),
            'document' => new SignoffDocumentResource($document),
        ]);
    }
}
