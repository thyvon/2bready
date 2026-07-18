<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Journey\Actions\CreateJourneyTemplateAction;
use App\Domain\Journey\Actions\DeleteJourneyTemplateAction;
use App\Domain\Journey\Actions\UpdateJourneyTemplateAction;
use App\Domain\Journey\DTOs\JourneyTemplateData;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Journey\StoreJourneyTemplateRequest;
use App\Http\Requests\Api\V1\Journey\UpdateJourneyTemplateRequest;
use App\Http\Resources\Api\V1\JourneyTemplateResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class JourneyTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', JourneyTemplate::class);

        $templates = JourneyTemplate::query()->with('industry')->orderBy('country_code')->get();

        return ApiResponse::success(JourneyTemplateResource::collection($templates));
    }

    public function store(StoreJourneyTemplateRequest $request, CreateJourneyTemplateAction $action): JsonResponse
    {
        $this->authorize('create', JourneyTemplate::class);

        $journeyTemplate = $action->execute(JourneyTemplateData::from($request->validated()));

        return ApiResponse::created(new JourneyTemplateResource($journeyTemplate));
    }

    public function show(JourneyTemplate $journeyTemplate): JsonResponse
    {
        $this->authorize('view', $journeyTemplate);

        $journeyTemplate->load(['industry', 'levels.milestones.documentTemplates']);

        return ApiResponse::success(new JourneyTemplateResource($journeyTemplate));
    }

    public function update(UpdateJourneyTemplateRequest $request, JourneyTemplate $journeyTemplate, UpdateJourneyTemplateAction $action): JsonResponse
    {
        $this->authorize('update', $journeyTemplate);

        $journeyTemplate = $action->execute($journeyTemplate, $request->validated());

        return ApiResponse::success(new JourneyTemplateResource($journeyTemplate));
    }

    public function destroy(JourneyTemplate $journeyTemplate, DeleteJourneyTemplateAction $action): JsonResponse
    {
        $this->authorize('delete', $journeyTemplate);

        $action->execute($journeyTemplate);

        return ApiResponse::noContent();
    }
}
