<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Payment\Actions\ConfirmPaymentAction;
use App\Domain\Payment\Actions\RejectPaymentAction;
use App\Domain\Payment\Actions\SubmitManualPaymentAction;
use App\Domain\Payment\Models\Payment;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PaymentResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Payment::class);

        // BelongsToCompany's global scope already restricts this to the current
        // user's own company (with the internal-role bypass built in) — see Rule #1.
        $query = Payment::query()->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return ApiResponse::success(PaymentResource::collection($query->get()));
    }

    public function submit(Payment $payment, SubmitManualPaymentAction $action): JsonResponse
    {
        $this->authorize('submit', $payment);

        $payment = $action->execute($payment);

        return ApiResponse::success(new PaymentResource($payment));
    }

    public function confirm(Request $request, Payment $payment, ConfirmPaymentAction $action): JsonResponse
    {
        $this->authorize('confirm', $payment);

        $payment = $action->execute($payment, $request->user());

        return ApiResponse::success(new PaymentResource($payment));
    }

    public function reject(Payment $payment, RejectPaymentAction $action): JsonResponse
    {
        $this->authorize('reject', $payment);

        $payment = $action->execute($payment);

        return ApiResponse::success(new PaymentResource($payment));
    }
}
