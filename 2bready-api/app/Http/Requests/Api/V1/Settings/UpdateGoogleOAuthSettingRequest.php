<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGoogleOAuthSettingRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'enabled' => ['required', 'boolean'],
            'client_id' => ['required', 'string', 'max:255'],
            // Omitted/empty means "keep the existing secret" — see
            // GoogleOAuthSettingService::save(). Never required, since after the
            // first save the frontend never has the real value to resend.
            'client_secret' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
