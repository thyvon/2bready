<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Package\Actions\CaptureLeadAction;
use App\Domain\Package\DTOs\LeadData;
use App\Domain\Package\Models\Lead;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Payment\CaptureLeadRequest;
use App\Http\Resources\Api\V1\LeadResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class LeadController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Lead::class);

        return ApiResponse::success(LeadResource::collection(Lead::query()->latest()->get()));
    }

    public function store(CaptureLeadRequest $request, CaptureLeadAction $action): JsonResponse
    {
        $lead = $action->execute(LeadData::from($request->validated()), $request->user());

        return ApiResponse::created(new LeadResource($lead));
    }
}
