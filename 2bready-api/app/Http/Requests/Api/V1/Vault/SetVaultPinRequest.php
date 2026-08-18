<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Vault;

use App\Domain\Shared\Services\PlatformSettingService;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Admin-only: set/rotate a company's vault PIN. The digit-count comes from
 * platform_settings.vault_pin_length (seed 6) — v3 §0.5's "configurable PIN
 * policy, not a hardcoded maxlength". Digits-only, never echoed back.
 */
class SetVaultPinRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        $length = (int) app(PlatformSettingService::class)->get('vault_pin_length', 6);

        return [
            'company_id' => ['required', 'string', 'exists:companies,id'],
            'pin' => ['required', 'string', 'digits:'.$length],
        ];
    }
}
