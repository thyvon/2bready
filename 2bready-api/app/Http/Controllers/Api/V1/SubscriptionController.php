<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Package\Models\Package;
use App\Domain\Payment\Actions\SubscribeToPackageAction;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Models\Subscription;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Payment\SubscribeRequest;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Subscription::class);

        // BelongsToCompany's global scope already restricts this to the current
        // user's own company (with the internal-role bypass built in) — see Rule #1.
        $subscriptions = Subscription::query()->with('package')->latest()->get();

        return ApiResponse::success(SubscriptionResource::collection($subscriptions));
    }

    public function store(SubscribeRequest $request, SubscribeToPackageAction $action): JsonResponse
    {
        $this->authorize('subscribe', Subscription::class);

        $user = $request->user();
        $package = Package::query()->where('is_active', true)->findOrFail($request->validated('package_id'));

        $result = $action->execute($user->company, $package, PaymentMethod::from($request->validated('method')));

        return ApiResponse::created([
            'subscription' => new SubscriptionResource($result['subscription']),
            'payment' => new PaymentResource($result['payment']),
            'gateway_data' => $result['gateway_data'],
        ]);
    }
}
