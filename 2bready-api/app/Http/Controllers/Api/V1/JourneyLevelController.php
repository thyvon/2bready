<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Journey\Models\JourneyLevel;
use App\Domain\Package\Models\Package;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\JourneyLevelResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Read-only flat list — the fixed taxonomy (4 levels, 1 template today), not
 * a company's own progress through it (that's JourneyController's job).
 * Exists so the admin-portal package form can offer a journey_level_id
 * dropdown; gated on package.view (not journey.view, which finance doesn't
 * hold despite being able to view/manage packages) since that's the only
 * current consumer.
 */
class JourneyLevelController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Package::class);

        $levels = JourneyLevel::query()->orderBy('sort_order')->get();

        return ApiResponse::success(JourneyLevelResource::collection($levels));
    }
}
