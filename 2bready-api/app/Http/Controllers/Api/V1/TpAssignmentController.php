<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Actions\BuildJourneyForCompanyAction;
use App\Domain\Journey\Services\JourneyProgressService;
use App\Domain\Marketplace\Models\TpHire;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CompanyResource;
use App\Http\Resources\Api\V1\JourneyResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The TP-self side of a hire — "which companies am I actively engaged for,
 * and what's their Journey progress" (tp-portal's companies list + per-
 * company review screen). Deliberately a separate controller from
 * TpHireController (admin CRUD) — this one is scoped entirely to the
 * caller's own firm, no marketplace.manage permission involved.
 */
class TpAssignmentController extends Controller
{
    public function myCompanies(Request $request): JsonResponse
    {
        $tpPartnerId = $request->user()->auditor?->tp_partner_id;

        abort_if($tpPartnerId === null, 403, 'This account has no TP firm attached.');

        // withoutGlobalScope('company') — a TP/auditor caller is never
        // company-bypassed the way admin/staff are (see BelongsToCompany's
        // null-current_company_id fix), so the unscoped call here is
        // deliberate, not a leak: it's immediately re-narrowed to exactly
        // this firm's active hires.
        $hires = TpHire::query()->withoutGlobalScope('company')
            ->where('tp_partner_id', $tpPartnerId)
            ->where('status', 'active')
            ->get(['company_id', 'journey_level']);

        // A firm can hold more than one active hire for the same company
        // (e.g. L2 now, L3 added later) — surfaced as a small level list per
        // company_id, not folded into CompanyResource itself (that resource
        // has no concept of "hired by this TP", it's generic).
        $hiredLevelsByCompany = $hires->groupBy('company_id')
            ->map(fn ($rows) => $rows->pluck('journey_level')->unique()->values());

        $companies = Company::query()->whereIn('id', $hiredLevelsByCompany->keys())->get();

        return ApiResponse::success(CompanyResource::collection($companies), [
            'hired_levels' => $hiredLevelsByCompany,
        ]);
    }

    public function companyJourney(Request $request, Company $company, BuildJourneyForCompanyAction $action, JourneyProgressService $progress): JsonResponse
    {
        $tpPartnerId = $request->user()->auditor?->tp_partner_id;

        // The set of levels this firm is actively hired for at this
        // company — never a single boolean, since a firm can hold hires at
        // more than one level. The journey tree below is filtered down to
        // exactly this set: a firm hired only for L2 must never receive
        // L3/L4 nodes at all, not just have them hidden client-side (see
        // DocumentPolicy::manage()'s matching level check for the same
        // reasoning on the verify/reject side).
        $hiredLevels = TpHire::query()->withoutGlobalScope('company')
            ->where('tp_partner_id', $tpPartnerId)
            ->where('company_id', $company->id)
            ->where('status', 'active')
            ->pluck('journey_level')
            ->unique();

        abort_if($hiredLevels->isEmpty(), 403, 'Your firm has no active engagement with this company.');

        $journey = $action->execute($company->id, bypassCompanyScope: true);

        if (! $journey) {
            return ApiResponse::error('No journey found for this company.', [], 404);
        }

        // Hired isn't the same as unlocked — a level the company hasn't
        // progressed/subscribed into yet stays out of a TP's view entirely,
        // even if a hire for it exists (e.g. created ahead of the company
        // actually reaching that stage). Intersect rather than trust
        // hiredLevels alone.
        $unlockedLevelCodes = $progress->unlockedLevelCodes($company);

        $journey->journeyTemplate->setRelation(
            'levels',
            $journey->journeyTemplate->levels
                ->filter(fn ($level) => $hiredLevels->contains($level->code) && in_array($level->code, $unlockedLevelCodes, true))
                ->values(),
        );

        return ApiResponse::success(new JourneyResource($journey));
    }
}
