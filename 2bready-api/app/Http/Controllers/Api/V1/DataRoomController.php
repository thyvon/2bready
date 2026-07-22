<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\DataRoom\Actions\CreateDataRoomLinkAction;
use App\Domain\DataRoom\Actions\RevokeDataRoomLinkAction;
use App\Domain\DataRoom\Models\DataRoomLink;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DataRoomLinkResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * DataRoomLink deliberately doesn't use BelongsToCompany (see the model's
 * docblock — the public verify path is unauthenticated), so every method
 * here scopes by $request->user()->current_company_id explicitly instead
 * of relying on a global scope / route-model binding.
 */
class DataRoomController extends Controller
{
    // The latest link for the caller's company, whatever its current
    // status (active/expired/revoked) — the frontend needs to render all
    // three states, not just "is there an active one".
    public function show(Request $request): JsonResponse
    {
        $link = DataRoomLink::query()
            ->where('company_id', $request->user()->current_company_id)
            ->latest()
            ->first();

        return ApiResponse::success($link ? new DataRoomLinkResource($link) : null);
    }

    public function store(Request $request, CreateDataRoomLinkAction $action): JsonResponse
    {
        $company = Company::query()->findOrFail($request->user()->current_company_id);

        ['link' => $link, 'pin' => $pin] = $action->execute($company, $request->user());

        return ApiResponse::created(new DataRoomLinkResource($link, $pin));
    }

    public function destroy(Request $request, RevokeDataRoomLinkAction $action): JsonResponse
    {
        $link = DataRoomLink::query()
            ->where('company_id', $request->user()->current_company_id)
            ->whereNull('revoked_at')
            ->latest()
            ->firstOrFail();

        $action->execute($link, $request->user());

        return ApiResponse::success(new DataRoomLinkResource($link->fresh()));
    }
}
