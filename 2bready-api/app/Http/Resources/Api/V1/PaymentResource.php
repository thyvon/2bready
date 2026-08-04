<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $isBankTransfer = $this->method === PaymentMethod::ManualBankTransfer;

        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'payable_id' => $this->payable_id,
            // The short morph alias ('subscription' | 'tp_hire' — see AppServiceProvider's
            // morph map), not a raw class name, so the frontend can label a row ("Package: X"
            // vs "TP Hire: Firm — L3") without knowing anything about backend class paths.
            'payable_type' => $this->payable_type,
            'amount_cents' => $this->amount_cents,
            'currency' => $this->currency,
            'method' => $this->method,
            'status' => $this->status,
            'gateway_reference' => $this->gateway_reference,
            // Static, non-secret instructions from config('payment.bank_transfer.*') —
            // the same data ManualBankTransferGateway::initiate() already hands back
            // once at creation time, now on every row so the frontend can offer a
            // persistent "View Bank Details" affordance instead of a one-shot dialog
            // the company loses access to if they close it before paying.
            'bank_name' => $isBankTransfer ? config('payment.bank_transfer.bank_name') : null,
            'account_name' => $isBankTransfer ? config('payment.bank_transfer.account_name') : null,
            'account_number' => $isBankTransfer ? config('payment.bank_transfer.account_number') : null,
            'submitted_at' => $this->submitted_at,
            'confirmed_at' => $this->confirmed_at,
            'created_at' => $this->created_at,
        ];
    }
}
