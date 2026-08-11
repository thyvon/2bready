<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Settings;

use App\Domain\Shared\Services\BrandingService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Platform logo upload — settings.manage only, and MIME + size validated
 * here before anything touches storage (filesystem rule: validate first,
 * serve only via signed URLs). SVG is accepted: it is served through a
 * temporaryUrl as an <img> source, never inline, so no script context.
 *
 * `slot` selects which of the four branding slots the file lands in
 * (main/dark/footer/footer_dark); it defaults to 'main' when omitted.
 */
class UploadLogoRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'logo' => ['required', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'slot' => ['sometimes', 'string', Rule::in(BrandingService::slots())],
        ];
    }
}
