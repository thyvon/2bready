<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\LegalConsent;

use Illuminate\Foundation\Http\FormRequest;

class AcceptLegalConsentRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'journey_level' => ['required', 'string', 'in:L3,L4'],
        ];
    }
}
