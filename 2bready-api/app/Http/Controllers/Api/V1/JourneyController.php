<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Journey\Actions\BuildJourneyForCompanyAction;
use App\Domain\Journey\Actions\CompleteMilestoneAction;
use App\Domain\Journey\Models\Journey;
use App\Domain\Journey\Models\Milestone;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\JourneyResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JourneyController extends Controller
{
    public function __construct(
        private readonly BuildJourneyForCompanyAction $buildJourney,
    ) {}

    // The caller's own company's journey — no {company} param, since a
    // company_owner/member always views their own, never picks one by ID.
    public function show(Request $request): JsonResponse
    {
        $this->authorize('view', Journey::class);

        return $this->journeyResponse($request->user()->current_company_id);
    }

    // Back-office view — staff looks up a specific company's progress before
    // deciding what to sign off. A company_owner/member hitting this with
    // someone else's company ID still gets nothing: Journey::BelongsToCompany
    // scopes the query to their own current_company_id regardless of which
    // {company} was requested, same as every other tenant-scoped lookup.
    public function showForCompany(Company $company): JsonResponse
    {
        $this->authorize('view', Journey::class);

        return $this->journeyResponse($company->id);
    }

    // Week-1 admin-signoff completion — see CompleteMilestoneAction.
    public function completeMilestone(Company $company, Milestone $milestone, Request $request, CompleteMilestoneAction $action): JsonResponse
    {
        $this->authorize('complete', Journey::class);

        $completion = $action->execute($company, $milestone, $request->user());

        return ApiResponse::created([
            'id' => $completion->id,
            'milestone_id' => $completion->milestone_id,
            'completed_at' => $completion->completed_at,
            'trigger' => $completion->trigger,
        ]);
    }

    private function journeyResponse(?string $companyId): JsonResponse
    {
        $journey = $this->buildJourney->execute($companyId);

        if (! $journey) {
            return ApiResponse::error('No journey found for this company.', [], 404);
        }

        return ApiResponse::success(new JourneyResource($journey));
    }
}
