<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\TpPartner;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Firm self-service slice of a TP partner — the identity fields only
 * (name / name_kh). Deliberately no status here: a firm's own auditors must
 * never be able to suspend or reactivate themselves through this endpoint;
 * that stays exclusively in UpdateTpPartnerRequest (admin-only update()).
 */
class UpdateTpPartnerProfileRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'name_kh' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
