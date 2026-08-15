<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Actions\CreateDocumentTemplateAction;
use App\Domain\Document\Actions\DeleteDocumentTemplateAction;
use App\Domain\Document\Actions\UpdateDocumentTemplateAction;
use App\Domain\Document\DTOs\DocumentTemplateData;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Journey\Models\Milestone;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Document\StoreDocumentTemplateRequest;
use App\Http\Requests\Api\V1\Document\UpdateDocumentTemplateRequest;
use App\Http\Resources\Api\V1\DocumentTemplateResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use App\Domain\User\Models\User;

// No index() here — document templates are always fetched nested inside a
// JourneyTemplate's tree via JourneyTemplateController::show. Don't confuse
// with DocumentController::templates, an unrelated read-only endpoint that
// shows one company's own upload progress against these templates.
class DocumentTemplateController extends Controller
{
    // Global taxonomy, root-level — company_id always null.
    public function store(StoreDocumentTemplateRequest $request, Milestone $milestone, CreateDocumentTemplateAction $action): JsonResponse
    {
        $this->authorize('create', DocumentTemplate::class);

        $documentTemplate = $action->execute(DocumentTemplateData::from([
            ...$request->validated(),
            'milestone_id' => $milestone->id,
        ]));

        return ApiResponse::created(new DocumentTemplateResource($documentTemplate));
    }

    // Global taxonomy, nested under an existing document template.
    public function storeChild(StoreDocumentTemplateRequest $request, DocumentTemplate $documentTemplate, CreateDocumentTemplateAction $action): JsonResponse
    {
        $this->authorize('create', DocumentTemplate::class);

        $child = $action->execute(DocumentTemplateData::from([
            ...$request->validated(),
            'milestone_id' => $documentTemplate->milestone_id,
            'parent_id' => $documentTemplate->id,
            // Inherits the parent's scope — a sub-document under a company
            // extra is itself scoped to that same company automatically.
            'company_id' => $documentTemplate->company_id,
        ]));

        return ApiResponse::created(new DocumentTemplateResource($child));
    }

    // Company-specific extra, root-level — added by staff from that
    // company's own Journey tab, on top of the shared taxonomy. company_id
    // is always derived from the route, never trusted from the request body.
    public function storeForCompany(StoreDocumentTemplateRequest $request, Company $company, Milestone $milestone, CreateDocumentTemplateAction $action): JsonResponse
    {
        $this->authorize('create', DocumentTemplate::class);

        $documentTemplate = $action->execute(DocumentTemplateData::from([
            ...$request->validated(),
            'milestone_id' => $milestone->id,
            'company_id' => $company->id,
        ]));

        return ApiResponse::created(new DocumentTemplateResource($documentTemplate));
    }

    // Company-specific extra, nested under an existing document template —
    // that parent must itself be visible to this company (global, or
    // already scoped to this same company), so staff can't attach a private
    // extra onto a document template that belongs to a different company.
    public function storeChildForCompany(StoreDocumentTemplateRequest $request, Company $company, DocumentTemplate $documentTemplate, CreateDocumentTemplateAction $action): JsonResponse
    {
        $this->authorize('create', DocumentTemplate::class);

        if ($documentTemplate->company_id !== null && $documentTemplate->company_id !== $company->id) {
            throw ValidationException::withMessages([
                'document_template' => ['This document belongs to a different company.'],
            ]);
        }

        $child = $action->execute(DocumentTemplateData::from([
            ...$request->validated(),
            'milestone_id' => $documentTemplate->milestone_id,
            'parent_id' => $documentTemplate->id,
            'company_id' => $company->id,
        ]));

        return ApiResponse::created(new DocumentTemplateResource($child));
    }

    public function update(UpdateDocumentTemplateRequest $request, DocumentTemplate $documentTemplate, UpdateDocumentTemplateAction $action): JsonResponse
    {
        $this->authorize('update', $documentTemplate);

        $documentTemplate = $action->execute($documentTemplate, $request->validated());

        return ApiResponse::success(new DocumentTemplateResource($documentTemplate));
    }

    public function destroy(DocumentTemplate $documentTemplate, DeleteDocumentTemplateAction $action): JsonResponse
    {
        $this->authorize('delete', $documentTemplate);

        $action->execute($documentTemplate);

        return ApiResponse::noContent();
    }

    // Company self-scoped child creation — the logged-in company adds a
    // sub-document under a template they're allowed to extend.
    // Route: POST /my/document-templates/{documentTemplate}/children
    public function storeOwnChild(StoreDocumentTemplateRequest $request, DocumentTemplate $documentTemplate, CreateDocumentTemplateAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('addChild', $documentTemplate);

        $child = $action->execute(DocumentTemplateData::from([
            ...$request->validated(),
            'milestone_id' => $documentTemplate->milestone_id,
            'parent_id' => $documentTemplate->id,
            'company_id' => $user->current_company_id,
            // Client-added sub-docs are simple one-time, non-required by default
            'recurrence_type' => 'one_time',
            'is_required' => false,
        ]));

        return ApiResponse::created(new DocumentTemplateResource($child));
    }

    // Company self-scoped update — the logged-in company updates their own sub-document.
    // Route: PATCH /my/document-templates/{documentTemplate}
    public function updateOwn(UpdateDocumentTemplateRequest $request, DocumentTemplate $documentTemplate, UpdateDocumentTemplateAction $action): JsonResponse
    {
        $this->authorize('updateOwn', $documentTemplate);

        // Only allow certain fields for client updates (not recurrence_type, expiry_months, etc.)
        $data = array_intersect_key($request->validated(), array_flip([
            'name', 'description', 'is_required', 'client_can_add_subdocs',
        ]));

        $documentTemplate = $action->execute($documentTemplate, $data);

        return ApiResponse::success(new DocumentTemplateResource($documentTemplate));
    }

    // Company self-scoped delete — the logged-in company deletes their own sub-document.
    // Route: DELETE /my/document-templates/{documentTemplate}
    public function destroyOwn(DocumentTemplate $documentTemplate, DeleteDocumentTemplateAction $action): JsonResponse
    {
        $this->authorize('deleteOwn', $documentTemplate);

        $action->execute($documentTemplate);

        return ApiResponse::noContent();
    }
}
