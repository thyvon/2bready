<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Actions\UpdateCompanyUserAction;
use App\Domain\Company\Models\Company;
use App\Domain\User\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Company\UpdateCompanyUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Staff acting on a company's own team (company_owner/company_member) — the
 * back-office-oversight case, not self-service (see feedback memory on
 * admin-portal's scope: "staff doing something to a company" belongs here,
 * "a company doing something for itself" belongs in client-portal only).
 */
class CompanyUserController extends Controller
{
    // View is broader than mutate: anyone who can view the company (admin/
    // staff/finance) can see its team, but only user.manage holders
    // (admin/staff) can change a member's status or role — narrower than
    // "can view", matching how the rest of this app splits view vs manage.
    public function index(Company $company): JsonResponse
    {
        $this->authorize('view', $company);

        // UserResource also serializes `companies` — without eager-loading it
        // here too, that lazy-loads per row (blocked outright by
        // Model::shouldBeStrict() outside production, and a real N+1 in
        // production even when it's not blocked).
        $users = $company->users()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['company_owner', 'company_member']))
            ->with(['roles', 'companies'])
            ->get();

        return ApiResponse::success(UserResource::collection($users));
    }

    public function update(UpdateCompanyUserRequest $request, Company $company, User $user, UpdateCompanyUserAction $action): JsonResponse
    {
        // Reuses UserPolicy::update() (user.manage) rather than a fresh inline
        // permission-string check — same ability the internal Users page
        // already gates on, just applied to a company-side target here.
        $this->authorize('update', $user);
        abort_unless($user->hasAnyRole(['company_owner', 'company_member']), 404);
        abort_unless($company->users()->where('users.id', $user->id)->exists(), 404);

        $user = $action->execute($company, $user, $request->validated());

        return ApiResponse::success(new UserResource($user->load(['roles', 'companies'])));
    }
}
