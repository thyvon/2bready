<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Company\Models\Company;
use App\Domain\Vault\Actions\LockVaultAction;
use App\Domain\Vault\Actions\SetVaultPinAction;
use App\Domain\Vault\Actions\VerifyVaultPinAction;
use App\Domain\Vault\Services\VaultAccessService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Vault\SetVaultPinRequest;
use App\Http\Requests\Api\V1\Vault\VerifyVaultPinRequest;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Back-office vault (v3 §4.2/§5.1): set/reset a company's vault PIN and
 * open/close the unlock session that lets admin/finance preview sensitive
 * L3/L4 documents. The PIN itself is only ever accepted inbound — never
 * serialized back. Route-level permission middleware gates roles: set-pin is
 * admin-only, unlock/lock are admin+finance (the blueprint's "admin or
 * finance can unlock"; staff has document.view but no vault role).
 */
class VaultController extends Controller
{
    // Status the admin-portal renders the lock badge from — pin_set tells the
    // UI whether to show "Set PIN" vs the unlock dialog; seconds_remaining
    // drives the countdown without the frontend owning the timeout.
    public function status(Request $request): JsonResponse
    {
        $company = Company::query()->findOrFail($request->string('company_id')->toString());

        return ApiResponse::success([
            'company_id' => $company->id,
            'pin_set' => $this->vault()->hasPin($company),
            'unlocked' => $request->user() ? $this->vault()->isUnlocked($request->user(), $company) : false,
            'seconds_remaining' => $request->user() ? $this->vault()->secondsRemaining($request->user(), $company) : 0,
            'pin_length' => $this->vault()->pinLength(),
        ]);
    }

    public function setPin(SetVaultPinRequest $request, SetVaultPinAction $action): JsonResponse
    {
        $company = Company::query()->findOrFail($request->validated('company_id'));
        $action->execute($company, $request->validated('pin'));

        return ApiResponse::success(['company_id' => $company->id, 'pin_set' => true]);
    }

    public function unlock(VerifyVaultPinRequest $request, VerifyVaultPinAction $action): JsonResponse
    {
        $company = Company::query()->findOrFail($request->validated('company_id'));
        $action->execute($company, $request->validated('pin'), $request->user()->id);

        return ApiResponse::success([
            'company_id' => $company->id,
            'unlocked' => true,
        ]);
    }

    public function lock(Request $request, LockVaultAction $action): JsonResponse
    {
        $company = Company::query()->findOrFail($request->string('company_id')->toString());
        $action->execute($request->user(), $company);

        return ApiResponse::success(['company_id' => $company->id, 'unlocked' => false]);
    }

    private function vault(): VaultAccessService
    {
        return app(VaultAccessService::class);
    }
}
