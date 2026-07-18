<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Journey\Actions\CreateJourneyLevelAction;
use App\Domain\Journey\Actions\DeleteJourneyLevelAction;
use App\Domain\Journey\Actions\UpdateJourneyLevelAction;
use App\Domain\Journey\DTOs\JourneyLevelData;
use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Journey\Models\JourneyTemplate;
use App\Domain\Package\Models\Package;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Journey\StoreJourneyLevelRequest;
use App\Http\Requests\Api\V1\Journey\UpdateJourneyLevelRequest;
use App\Http\Resources\Api\V1\JourneyLevelResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * `index` is a read-only flat list — the fixed taxonomy, not a company's own
 * progress through it (that's JourneyController's job). Exists so the
 * admin-portal package form can offer a journey_level_id dropdown; gated on
 * package.view (not journey_template.view, which finance doesn't hold
 * despite being able to view/manage packages) since that's the only consumer.
 *
 * `store/update/destroy` are the real taxonomy-authoring actions, gated
 * separately via JourneyLevelPolicy (journey_template.manage) — left on this
 * same controller since they operate on the same model, not the same
 * authorization concern as `index`.
 */
class JourneyLevelController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Package::class);

        $levels = JourneyLevel::query()->orderBy('sort_order')->get();

        return ApiResponse::success(JourneyLevelResource::collection($levels));
    }

    public function store(StoreJourneyLevelRequest $request, JourneyTemplate $journeyTemplate, CreateJourneyLevelAction $action): JsonResponse
    {
        $this->authorize('create', JourneyLevel::class);

        $journeyLevel = $action->execute(JourneyLevelData::from([
            ...$request->validated(),
            'journey_template_id' => $journeyTemplate->id,
        ]));

        return ApiResponse::created(new JourneyLevelResource($journeyLevel));
    }

    public function update(UpdateJourneyLevelRequest $request, JourneyLevel $journeyLevel, UpdateJourneyLevelAction $action): JsonResponse
    {
        $this->authorize('update', $journeyLevel);

        $journeyLevel = $action->execute($journeyLevel, $request->validated());

        return ApiResponse::success(new JourneyLevelResource($journeyLevel));
    }

    public function destroy(JourneyLevel $journeyLevel, DeleteJourneyLevelAction $action): JsonResponse
    {
        $this->authorize('delete', $journeyLevel);

        $action->execute($journeyLevel);

        return ApiResponse::noContent();
    }
}
