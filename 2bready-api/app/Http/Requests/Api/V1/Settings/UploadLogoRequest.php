<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Settings;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Platform logo upload — settings.manage only, and MIME + size validated
 * here before anything touches storage (filesystem rule: validate first,
 * serve only via signed URLs). SVG is accepted: it is served through a
 * temporaryUrl as an <img> source, never inline, so no script context.
 */
class UploadLogoRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'logo' => ['required', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
        ];
    }
}
