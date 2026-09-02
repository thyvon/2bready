<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\SignOff\Actions\ListVerifiedJourneyDocumentsAction;
use App\Domain\SignOff\Actions\ReviewSignoffDocumentAction;
use App\Domain\SignOff\Actions\SendJourneyDocumentToStaffAction;
use App\Domain\SignOff\Actions\SendSignoffDocumentToStaffAction;
use App\Domain\SignOff\Actions\UploadSignoffDocumentAction;
use App\Domain\SignOff\Models\SignoffDocument;
use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SignOff\SendSignoffDocumentRequest;
use App\Http\Requests\Api\V1\SignOff\StoreSignoffDocumentRequest;
use App\Http\Resources\Api\V1\SignoffDocumentResource;
use App\Http\Resources\Api\V1\SignoffDocumentUserResource;
use App\Http\Resources\Api\V1\VerifiedJourneyDocumentResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

/**
 * Signed-off Documents — one endpoint set for both portals. Company users
 * (BelongsToCompany scope) manage their own documents; internal roles see
 * the verification queue and hold the verify/reject powers.
 */
class SignOffDocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SignoffDocument::class);

        $query = SignoffDocument::query()
            ->with(['verifier', 'users.user'])
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        // Internal-only narrowing (company workspace view) — deliberate
        // filter on top of the already-lifted tenant scope.
        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        return ApiResponse::success(SignoffDocumentResource::collection($query->get()));
    }

    /**
     * Lists verified journey documents eligible for signoff.
     * Excludes documents already linked to a signoff_document record.
     */
    public function verifiedJourneyDocuments(Request $request, ListVerifiedJourneyDocumentsAction $action): JsonResponse
    {
        $this->authorize('viewAny', SignoffDocument::class);

        $company = Company::findOrFail($request->user()->current_company_id);
        $documents = $action->execute($company);

        return ApiResponse::success(VerifiedJourneyDocumentResource::collection($documents));
    }

    public function store(StoreSignoffDocumentRequest $request, UploadSignoffDocumentAction $action): JsonResponse
    {
        $this->authorize('create', SignoffDocument::class);

        /** @var UploadedFile $file */
        $file = $request->file('file');
        $path = $file->store(
            "signoff-documents/{$request->user()->current_company_id}",
            config('filesystems.documents_disk'),
        );

        $document = $action->execute(
            Company::findOrFail($request->user()->current_company_id),
            $request->user(),
            $request->validated('category'),
            $request->validated('title'),
            $path,
            $file->getClientOriginalName(),
            $file->getMimeType(),
            (int) $file->getSize(),
        );

        return ApiResponse::created(new SignoffDocumentResource(
            $document->load(['verifier', 'users.user']),
        ));
    }

    public function show(Request $request, SignoffDocument $signoffDocument): JsonResponse
    {
        $this->authorize('view', $signoffDocument);

        $signoffDocument->load(['verifier', 'users.user']);

        return ApiResponse::success(new SignoffDocumentResource($signoffDocument));
    }

    public function destroy(Request $request, SignoffDocument $signoffDocument, ReviewSignoffDocumentAction $action): JsonResponse
    {
        $this->authorize('delete', $signoffDocument);

        $action->deleteFile($signoffDocument);
        $signoffDocument->delete();

        return ApiResponse::noContent();
    }

    public function verify(Request $request, SignoffDocument $signoffDocument, ReviewSignoffDocumentAction $action): JsonResponse
    {
        $this->authorize('verify', SignoffDocument::class);

        return ApiResponse::success(new SignoffDocumentResource(
            $action->verify($signoffDocument, $request->user())->load(['verifier', 'users.user']),
        ));
    }

    public function reject(Request $request, SignoffDocument $signoffDocument, ReviewSignoffDocumentAction $action): JsonResponse
    {
        $this->authorize('verify', SignoffDocument::class);

        $comment = (string) $request->input('comment', '');

        if ($comment === '') {
            return ApiResponse::error('A rejection comment is required.', [], 422);
        }

        return ApiResponse::success(new SignoffDocumentResource(
            $action->reject($signoffDocument, $request->user(), $comment)->load(['verifier', 'users.user']),
        ));
    }

    public function send(SendSignoffDocumentRequest $request, SignoffDocument $signoffDocument, SendSignoffDocumentToStaffAction $action): JsonResponse
    {
        $this->authorize('send', $signoffDocument);

        // Guard: recipients must belong to the document's company — prevents
        // cross-company leaks even from an internal caller.
        $recipients = User::query()
            ->whereIn('id', $request->validated('user_ids'))
            ->whereHas('companies', fn ($q) => $q->where('companies.id', $signoffDocument->company_id))
            ->pluck('id');

        if ($recipients->isEmpty()) {
            return ApiResponse::error('None of the selected users belong to this company.', [], 422);
        }

        $rows = $action->execute(
            $signoffDocument,
            Company::find($signoffDocument->company_id),
            $recipients->all(),
            $request->user(),
        );

        return ApiResponse::success(SignoffDocumentUserResource::collection($rows));
    }

    /**
     * Send a verified journey document to staff for signoff.
     * Creates a signoff_document record linked to the journey document.
     */
    public function sendJourneyDocument(SendSignoffDocumentRequest $request, string $documentId, SendJourneyDocumentToStaffAction $action): JsonResponse
    {
        $this->authorize('viewAny', SignoffDocument::class);

        $document = Document::query()
            ->withoutGlobalScope('company')
            ->where('id', $documentId)
            ->where('company_id', $request->user()->current_company_id)
            ->where('status', 'verified')
            ->firstOrFail();

        $company = Company::findOrFail($request->user()->current_company_id);

        $recipients = User::query()
            ->whereIn('id', $request->validated('user_ids'))
            ->whereHas('companies', fn ($q) => $q->where('companies.id', $company->id))
            ->pluck('id');

        if ($recipients->isEmpty()) {
            return ApiResponse::error('None of the selected users belong to this company.', [], 422);
        }

        $rows = $action->execute(
            $document,
            $company,
            $recipients->all(),
            $request->user(),
        );

        return ApiResponse::success(SignoffDocumentUserResource::collection($rows));
    }
}
