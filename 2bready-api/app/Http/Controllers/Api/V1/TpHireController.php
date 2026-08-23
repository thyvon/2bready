<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Marketplace\Actions\CancelTpHireAction;
use App\Domain\Marketplace\Actions\CompleteTpHireAction;
use App\Domain\Marketplace\Actions\CreateTpHireAction;
use App\Domain\Marketplace\Actions\MarkTpHirePaidOutAction;
use App\Domain\Marketplace\Actions\RateTpHireAction;
use App\Domain\Marketplace\Actions\UpdateTpHireAction;
use App\Domain\Marketplace\DTOs\TpHireData;
use App\Domain\Marketplace\Models\TpHire;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Marketplace\HireTpPartnerRequest;
use App\Http\Requests\Api\V1\Marketplace\RateTpHireRequest;
use App\Http\Requests\Api\V1\Marketplace\StoreTpHireRequest;
use App\Http\Requests\Api\V1\Marketplace\UpdateTpHireRequest;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Http\Resources\Api\V1\TpHireResource;
use App\Http\Resources\Api\V1\TpRatingResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TpHireController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', TpHire::class);

        // Admin/staff (marketplace.manage) get every company's hires via
        // BelongsToCompany's bypass; nothing in v1 lists TpHires as a TP
        // user through this endpoint (they use TpAssignmentController's
        // myCompanies/companyDocuments instead), so no auditor branch here.
        $query = TpHire::query()->with(['company', 'tpPartner', 'rating'])->latest();

        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        return ApiResponse::success(TpHireResource::collection($query->get()));
    }

    public function store(StoreTpHireRequest $request, CreateTpHireAction $action): JsonResponse
    {
        $this->authorize('create', TpHire::class);

        $result = $action->execute(TpHireData::from($request->validated()), $request->user());

        return ApiResponse::created([
            'tp_hire' => new TpHireResource($result['tp_hire']),
            'payment' => new PaymentResource($result['payment']),
            'gateway_data' => $result['gateway_data'],
        ]);
    }

    /**
     * Self-service path — a company_owner hires a firm for their own
     * company, paying for it themselves. Distinct from store() above (admin
     * CRUD override, used for offline-sales/support cases): same underlying
     * CreateTpHireAction, but company_id is always the caller's own
     * current_company_id, never client-supplied. assigned_by_user_id is
     * stamped with the company_owner themselves (who initiated the hire).
     */
    public function hire(HireTpPartnerRequest $request, CreateTpHireAction $action): JsonResponse
    {
        $this->authorize('hire', TpHire::class);

        $data = TpHireData::from([
            'company_id' => $request->user()->current_company_id,
            'tp_partner_id' => $request->validated('tp_partner_id'),
            'journey_level' => $request->validated('journey_level'),
            'method' => $request->validated('method'),
        ]);

        $result = $action->execute($data, $request->user());

        return ApiResponse::created([
            'tp_hire' => new TpHireResource($result['tp_hire']),
            'payment' => new PaymentResource($result['payment']),
            'gateway_data' => $result['gateway_data'],
        ]);
    }

    // Pre-payment correction (admin only, TpHirePolicy::update) — changing
    // the level re-snapshots the price/commission/payout trio and keeps the
    // open payment aligned. Scoped implicit binding is fine: no TP-firm or
    // company caller is ever authorized to edit.
    public function update(UpdateTpHireRequest $request, TpHire $tpHire, UpdateTpHireAction $action): JsonResponse
    {
        $this->authorize('update', $tpHire);

        $tpHire = $action->execute($tpHire, $request->validated('journey_level'));

        return ApiResponse::success(new TpHireResource($tpHire));
    }

    // Resolved manually with withoutGlobalScope('company'), same reasoning as
    // DocumentController::verify/reject — the assigned TP caller allowed by
    // TpHirePolicy::complete() is never company-bypassed, so the scoped
    // implicit binding would 404 before the policy ever runs.
    public function complete(string $tpHire, CompleteTpHireAction $action): JsonResponse
    {
        $tpHire = TpHire::query()->withoutGlobalScope('company')->findOrFail($tpHire);
        $this->authorize('complete', $tpHire);

        $tpHire = $action->execute($tpHire);

        return ApiResponse::success(new TpHireResource($tpHire));
    }

    public function markPaidOut(Request $request, string $tpHire, MarkTpHirePaidOutAction $action): JsonResponse
    {
        $this->authorize('markPaidOut', TpHire::class);

        $tpHire = TpHire::query()->withoutGlobalScope('company')->findOrFail($tpHire);
        $tpHire = $action->execute($tpHire, $request->user());

        return ApiResponse::success(new TpHireResource($tpHire));
    }

    // The marketplace unhire flow — company_owner cancels their own
    // pending/active hire (TpHirePolicy::cancel). Scoped binding is fine
    // here: unlike complete(), no TP-firm caller ever reaches this route.
    public function cancel(TpHire $tpHire, CancelTpHireAction $action): JsonResponse
    {
        $this->authorize('cancel', $tpHire);

        $tpHire = $action->execute($tpHire);

        return ApiResponse::success(new TpHireResource($tpHire));
    }

    public function rate(RateTpHireRequest $request, TpHire $tpHire, RateTpHireAction $action): JsonResponse
    {
        $this->authorize('rate', $tpHire);

        $rating = $action->execute(
            $tpHire,
            (int) $request->validated('rating'),
            $request->validated('review_text'),
            $request->user(),
        );

        return ApiResponse::created(new TpRatingResource($rating));
    }
}
