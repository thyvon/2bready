<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Marketplace;

use App\Domain\Journey\Services\JourneyProgressService;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Self-service company hire — deliberately has no company_id field (unlike
// StoreTpHireRequest's admin path): the acting company_owner's own
// current_company_id is the only company this can ever act on, resolved
// server-side in the controller, never trusted from the client. Mirrors
// SubscribeRequest.
class HireTpPartnerRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'tp_partner_id' => ['required', 'string', 'exists:tp_partners,id'],
            'journey_level' => ['required', 'string', Rule::in(['L2', 'L3', 'L4'])],
            'method' => ['required', 'string', Rule::in(['manual_bank_transfer', 'stripe'])],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $level = $this->input('journey_level');
            if (! in_array($level, ['L2', 'L3', 'L4'], true)) {
                return; // shape already caught by the journey_level 'in' rule above
            }

            $company = $this->user()->currentCompany;
            if (! $company) {
                return; // TpHirePolicy::hire() rejects this with 403 right after validation
            }

            $unlocked = app(JourneyProgressService::class)->unlockedLevelCodes($company);
            if (! in_array($level, $unlocked, true)) {
                $validator->errors()->add('journey_level', "Unlock {$level} in your Compliance Journey before hiring at this level.");
            }
        });
    }
}
