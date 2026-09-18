<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Company;

use App\Domain\Journey\Models\Journey;
use App\Domain\Payment\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $company = $this->route('company');

        $rules = [
            'name' => ['sometimes', 'string', 'max:255'],
            'name_kh' => ['sometimes', 'nullable', 'string', 'max:255'],
            'registration_no' => ['sometimes', 'nullable', 'string', 'max:100'],
            'compliance_start_date' => ['sometimes', 'nullable', 'date', 'before_or_equal:today'],
            'industry_id' => [
                'sometimes', 'string', 'exists:industries,id',
                function ($attribute, $value, $fail) use ($company) {
                    if ($value === $company->industry_id) {
                        return;
                    }

                    $hasActiveJourney = Journey::where('company_id', $company->id)
                        ->where('status', 'active')
                        ->exists();

                    if ($hasActiveJourney) {
                        $fail('Cannot change industry while the company has an active journey. Please deactivate or complete the journey first.');
                    }

                    $hasActiveSubscription = Subscription::where('company_id', $company->id)
                        ->where('status', 'active')
                        ->exists();

                    if ($hasActiveSubscription) {
                        $fail('Cannot change industry while the company has an active subscription. Please cancel or expire the subscription first.');
                    }
                },
            ],
            'country_code' => [
                'sometimes', 'string', 'size:2',
                function ($attribute, $value, $fail) use ($company) {
                    if ($value === $company->country_code) {
                        return;
                    }

                    $hasActiveJourney = Journey::where('company_id', $company->id)
                        ->where('status', 'active')
                        ->exists();

                    if ($hasActiveJourney) {
                        $fail('Cannot change country while the company has an active journey. Please deactivate or complete the journey first.');
                    }

                    $hasActiveSubscription = Subscription::where('company_id', $company->id)
                        ->where('status', 'active')
                        ->exists();

                    if ($hasActiveSubscription) {
                        $fail('Cannot change country while the company has an active subscription. Please cancel or expire the subscription first.');
                    }
                },
            ],
            'default_locale' => ['sometimes', 'string', 'in:en,kh'],
        ];

        if ($this->user()?->hasAnyRole(['admin', 'staff', 'finance'])) {
            $rules['status'] = ['sometimes', 'string', 'in:active,suspended,inactive'];
            $rules['employee_count'] = ['sometimes', 'nullable', 'integer', 'min:0'];
        }

        return $rules;
    }
}
