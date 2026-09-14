<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Sop;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendSopSignoffRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route-level `permission:sop.manage` gates coarse access; object-level
        // (own-company SOP / adopted global) is enforced by
        // SopSignoffPolicy::send in the controller.
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => [
                'required',
                'ulid',
                Rule::exists('users', 'id'),
                // Employees must belong to the sender's company
                Rule::exists('company_user', 'user_id')->where(
                    fn ($q) => $q->where('company_id', $this->user()?->current_company_id),
                ),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'user_ids.*.exists' => 'Each employee must belong to your company.',
        ];
    }
}
