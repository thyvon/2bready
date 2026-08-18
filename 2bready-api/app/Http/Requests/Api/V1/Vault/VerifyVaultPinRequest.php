<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Vault;

use App\Domain\Shared\Services\PlatformSettingService;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Back-office unlock: the submitted PIN must match the company's
 * vault_pin_hash digit-count policy (platform_settings.vault_pin_length).
 * The comparison itself happens server-side in VerifyVaultPinAction.
 */
class VerifyVaultPinRequest extends FormRequest
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
