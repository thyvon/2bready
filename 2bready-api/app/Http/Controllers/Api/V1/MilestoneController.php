<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Journey\Actions\CreateMilestoneAction;
use App\Domain\Journey\Actions\DeleteMilestoneAction;
use App\Domain\Journey\Actions\UpdateMilestoneAction;
use App\Domain\Journey\DTOs\MilestoneData;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\Milestone;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Journey\StoreMilestoneRequest;
use App\Http\Requests\Api\V1\Journey\UpdateMilestoneRequest;
use App\Http\Resources\Api\V1\MilestoneResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

// No index() here — milestones are always fetched nested inside a
// JourneyTemplate's tree via JourneyTemplateController::show, never listed
// on their own.
class MilestoneController extends Controller
{
    public function store(StoreMilestoneRequest $request, JourneyLevel $journeyLevel, CreateMilestoneAction $action): JsonResponse
    {
        $this->authorize('create', Milestone::class);

        $milestone = $action->execute(MilestoneData::from([
            ...$request->validated(),
            'journey_level_id' => $journeyLevel->id,
        ]));

        return ApiResponse::created(new MilestoneResource($milestone));
    }

    public function update(UpdateMilestoneRequest $request, Milestone $milestone, UpdateMilestoneAction $action): JsonResponse
    {
        $this->authorize('update', $milestone);

        $milestone = $action->execute($milestone, $request->validated());

        return ApiResponse::success(new MilestoneResource($milestone));
    }

    public function destroy(Milestone $milestone, DeleteMilestoneAction $action): JsonResponse
    {
        $this->authorize('delete', $milestone);

        $action->execute($milestone);

        return ApiResponse::noContent();
    }
}
