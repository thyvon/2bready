<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Document\Models\Document;
use App\Domain\Marketplace\Models\TpHire;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CompanyResource;
use App\Http\Resources\Api\V1\DocumentResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The TP-self side of a hire — "which companies am I actively engaged for,
 * and what are their pending documents" (tp-portal's dashboard + per-company
 * review screen). Deliberately a separate controller from TpHireController
 * (admin CRUD) — this one is scoped entirely to the caller's own firm, no
 * marketplace.manage permission involved.
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
        $companyIds = TpHire::query()->withoutGlobalScope('company')
            ->where('tp_partner_id', $tpPartnerId)
            ->where('status', 'active')
            ->pluck('company_id');

        $companies = Company::query()->whereIn('id', $companyIds)->get();

        return ApiResponse::success(CompanyResource::collection($companies));
    }

    public function companyDocuments(Request $request, Company $company): JsonResponse
    {
        $tpPartnerId = $request->user()->auditor?->tp_partner_id;

        $hasActiveHire = TpHire::query()->withoutGlobalScope('company')
            ->where('tp_partner_id', $tpPartnerId)
            ->where('company_id', $company->id)
            ->where('status', 'active')
            ->exists();

        abort_unless($hasActiveHire, 403, 'Your firm has no active engagement with this company.');

        $documents = Document::query()->withoutGlobalScope('company')
            ->where('company_id', $company->id)
            ->with('documentTemplate')
            ->latest()
            ->get();

        return ApiResponse::success(DocumentResource::collection($documents));
    }
}
