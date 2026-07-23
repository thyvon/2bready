<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Actions\GeneratePreviewUrlAction;
use App\Domain\Document\Actions\RejectDocumentAction;
use App\Domain\Document\Actions\UploadDocumentAction;
use App\Domain\Document\Actions\VerifyDocumentAction;
use App\Domain\Document\Models\Document;
use App\Domain\Document\Models\DocumentTemplate;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Document\RejectDocumentRequest;
use App\Http\Requests\Api\V1\Document\StoreDocumentRequest;
use App\Http\Resources\Api\V1\DocumentResource;
use App\Http\Resources\Api\V1\DocumentTemplateResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    // Back-office review queue — BelongsToCompany's global scope already
    // bypasses to all companies for admin/staff/finance (Rule #1), so this
    // one query naturally becomes "every company's documents" for them and
    // "just my own" for anyone else, same pattern as PaymentController::index.
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Document::class);

        $query = Document::query()->with(['company', 'documentTemplate'])->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Explicit narrowing for the back-office "this one company's documents"
        // view (companies/{id} workspace tab) — deliberate filter on top of the
        // already-bypassed tenant scope, same pattern as PaymentController::index.
        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        return ApiResponse::success(DocumentResource::collection($query->get()));
    }

    // Every required document across the whole journey, each showing the
    // caller's own company's latest upload for it (or null — nothing
    // uploaded yet). One list, not paginated per level/milestone, since the
    // whole taxonomy is small (38 documents at MVP).
    public function templates(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Document::class);

        $companyId = $request->user()->current_company_id;

        $templates = DocumentTemplate::query()
            ->where(fn ($query) => $query->whereNull('company_id')->orWhere('company_id', $companyId))
            ->orderBy('sort_order')
            ->get();

        // ->latest('id'), not ->latest() (created_at) — that column has no
        // sub-second precision, so two documents created in the same second
        // tie and the DB can return either one first (see
        // CompleteMilestoneOnDocumentVerified's identical fix).
        $latestDocuments = Document::query()
            ->where('company_id', $companyId)
            ->whereIn('document_template_id', $templates->pluck('id'))
            ->latest('id')
            ->get()
            ->groupBy('document_template_id')
            ->map(fn ($docs) => $docs->first());

        $templates->each(function (DocumentTemplate $template) use ($latestDocuments) {
            $template->setAttribute('latest_document', $latestDocuments->get($template->id));
        });

        return ApiResponse::success(DocumentTemplateResource::collection(DocumentTemplate::nestFlat($templates)));
    }

    public function store(StoreDocumentRequest $request, UploadDocumentAction $action): JsonResponse
    {
        $this->authorize('upload', Document::class);

        $template = DocumentTemplate::query()->findOrFail($request->validated('document_template_id'));
        $company = Company::query()->findOrFail($request->user()->current_company_id);

        $document = $action->execute($company, $template, $request->file('file'), $request->user(), $request->validated('period_key'));

        return ApiResponse::created(new DocumentResource($document));
    }

    // Admin-signoff only, same reasoning as Journey's milestone completion —
    // no Auditor domain to delegate this to yet.
    public function verify(Document $document, Request $request, VerifyDocumentAction $action): JsonResponse
    {
        $this->authorize('manage', Document::class);

        $document = $action->execute($document, $request->user());

        return ApiResponse::success(new DocumentResource($document));
    }

    public function reject(Document $document, RejectDocumentRequest $request, RejectDocumentAction $action): JsonResponse
    {
        $this->authorize('manage', Document::class);

        $document = $action->execute($document, $request->validated('reason'));

        return ApiResponse::success(new DocumentResource($document));
    }

    // Short-lived (5 min) signed link so the frontend can render a PDF/image
    // inline (Content-Disposition: inline, correct Content-Type — see
    // GeneratePreviewUrlAction) without ever exposing the raw storage path
    // via DocumentResource. `{document}` route-model binding already scopes
    // to the caller's own company via Document::BelongsToCompany — a
    // mismatched id just 404s, same as every other tenant-scoped lookup.
    public function previewUrl(Document $document, GeneratePreviewUrlAction $action): JsonResponse
    {
        $this->authorize('view', $document);

        return ApiResponse::success([
            'url' => $action->execute($document),
            'mime_type' => $document->mime_type,
            'original_filename' => $document->original_filename,
        ]);
    }
}
