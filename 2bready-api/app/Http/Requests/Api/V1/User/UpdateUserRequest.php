<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\User;

use App\Domain\User\Models\User;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            // Email deliberately not editable here — changing it would need a
            // re-verification flow (ownership-of-inbox proof) that doesn't exist
            // yet; out of scope for this endpoint.
            'status' => ['sometimes', 'string', 'in:active,suspended,inactive'],
            'roles' => ['sometimes', 'array', 'min:1'],
            'roles.*' => ['string', Rule::in(User::INTERNAL_ROLES)],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            /** @var User $target */
            $target = $this->route('user');

            // No recovery path exists for "an admin locked themselves out" — the
            // account they'd need to fix it is the one that just lost access. Every
            // selectable role here (admin/staff/finance/auditor) grants
            // portal.admin.access, so self-editing roles can't lock someone out of
            // the portal itself the same way — only self-suspension can.
            if ($target->id === $this->user()?->id
                && $this->input('status')
                && $this->input('status') !== 'active') {
                $validator->errors()->add('status', 'You cannot change your own account status.');
            }
        });
    }
}
