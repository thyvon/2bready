<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Company;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $rules = [
            'name' => ['sometimes', 'string', 'max:255'],
            'name_kh' => ['sometimes', 'nullable', 'string', 'max:255'],
            'registration_no' => ['sometimes', 'nullable', 'string', 'max:100'],
            'industry_code' => ['sometimes', 'string', 'max:50'],
            'country_code' => ['sometimes', 'string', 'size:2'],
            'default_locale' => ['sometimes', 'string', 'in:en,kh'],
        ];

        // Only admin/staff/finance may change a company's status or employee_count — never
        // company_owner/company_member self-service. employee_count feeds CompanyBypassEvaluator's
        // compliance-bypass threshold, so it must be verified by internal staff, not self-declared
        // by the company being evaluated.
        if ($this->user()?->hasAnyRole(['admin', 'staff', 'finance'])) {
            $rules['status'] = ['sometimes', 'string', 'in:active,suspended,inactive'];
            $rules['employee_count'] = ['sometimes', 'nullable', 'integer', 'min:0'];
        }

        return $rules;
    }
}
