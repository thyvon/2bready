<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Package\Models\Package;
use App\Domain\Payment\Actions\SubscribeToPackageAction;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Models\Subscription;
use App\Exceptions\DuplicateSubscriptionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Payment\SubscribeRequest;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        $this->authorize('viewAny', Subscription::class);

        // BelongsToCompany's global scope already restricts this to the current
        // user's own company (with the internal-role bypass built in) — see Rule #1.
        // The explicit company_id narrowing serves the back-office Billing tab
        // (one company's subscriptions), same pattern as PaymentController::index —
        // a deliberate filter on top of an already-lifted tenant scope, not the
        // boundary itself. Company callers can't override their own scope's result,
        // so passing ?company_id= is only meaningful for internal callers.
        $query = Subscription::query()->with('package.journeyLevel')->latest();

        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        $subscriptions = $query->get();

        return ApiResponse::success(SubscriptionResource::collection($subscriptions));
    }

    public function store(SubscribeRequest $request, SubscribeToPackageAction $action): JsonResponse
    {
        $this->authorize('subscribe', Subscription::class);

        $user = $request->user();
        $package = Package::query()->where('is_active', true)->findOrFail($request->validated('package_id'));

        try {
            $result = $action->execute($user->currentCompany, $package, PaymentMethod::from($request->validated('method')));
        } catch (DuplicateSubscriptionException $e) {
            return ApiResponse::error($e->getMessage(), [], 409);
        }

        return ApiResponse::created([
            'subscription' => new SubscriptionResource($result['subscription']),
            'payment' => new PaymentResource($result['payment']),
            'gateway_data' => $result['gateway_data'],
        ]);
    }
}
