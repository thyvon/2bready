<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Sop;

use Illuminate\Foundation\Http\FormRequest;

class EffectiveSopContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route-level `permission:sop.view` gates coarse access; object-level
        // (adopted / own-company SOP) is enforced by SopPolicy::view in the
        // controller — nothing left to check here.
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'locale' => ['nullable', 'string', 'in:en,kh'],
        ];
    }
}
