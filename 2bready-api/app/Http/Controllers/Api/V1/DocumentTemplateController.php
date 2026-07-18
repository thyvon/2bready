<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

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

// No index() here — document templates are always fetched nested inside a
// JourneyTemplate's tree via JourneyTemplateController::show. Don't confuse
// with DocumentController::templates, an unrelated read-only endpoint that
// shows one company's own upload progress against these templates.
class DocumentTemplateController extends Controller
{
    public function store(StoreDocumentTemplateRequest $request, Milestone $milestone, CreateDocumentTemplateAction $action): JsonResponse
    {
        $this->authorize('create', DocumentTemplate::class);

        $documentTemplate = $action->execute(DocumentTemplateData::from([
            ...$request->validated(),
            'milestone_id' => $milestone->id,
        ]));

        return ApiResponse::created(new DocumentTemplateResource($documentTemplate));
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
}
